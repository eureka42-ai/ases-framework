export type ProviderErrorCode = "INVALID_REQUEST" | "TIMEOUT" | "CANCELLED" | "UNAVAILABLE" | "PROVIDER_FAILURE" | "BUDGET_EXCEEDED";

export class ProviderError extends Error {
  constructor(readonly code: ProviderErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ProviderError";
  }
}

export interface ProviderRequest {
  prompt: string;
  system?: string;
  maxOutputTokens?: number;
}

export interface ProviderResponse {
  text: string;
  provider: string;
  model: string;
  usage: { inputTokens?: number; outputTokens?: number };
}

export type CostRecord =
  | { status: "estimated"; amountUsd: number; source: string }
  | { status: "reported"; amountUsd: number; source: string }
  | { status: "unknown"; reason: string };

export function createCostRecord(record: CostRecord): CostRecord {
  if (record.status === "unknown") {
    if (!record.reason.trim()) throw new ProviderError("INVALID_REQUEST", "unknown cost requires a reason");
    return { status: "unknown", reason: record.reason.trim() };
  }
  if (!Number.isFinite(record.amountUsd) || record.amountUsd < 0 || !record.source.trim()) {
    throw new ProviderError("INVALID_REQUEST", "known cost requires a non-negative amount and source");
  }
  return { ...record, source: record.source.trim() };
}

/** Reserves estimated cost before dispatch, including concurrent calls. */
export class CallBudget {
  #reservedUsd = 0;

  constructor(readonly limitUsd: number) {
    if (!Number.isFinite(limitUsd) || limitUsd < 0) throw new ProviderError("INVALID_REQUEST", "budget limit must be a non-negative finite amount");
  }

  get reservedUsd(): number { return this.#reservedUsd; }
  get remainingUsd(): number { return Math.max(0, this.limitUsd - this.#reservedUsd); }

  async generate(provider: Provider, request: ProviderRequest, estimatedCostUsd: number, options: GenerateOptions = {}): Promise<ProviderResponse> {
    if (!Number.isFinite(estimatedCostUsd) || estimatedCostUsd < 0) throw new ProviderError("INVALID_REQUEST", "estimated call cost must be a non-negative finite amount");
    if (this.#reservedUsd + estimatedCostUsd > this.limitUsd) throw new ProviderError("BUDGET_EXCEEDED", "call blocked because it would exceed the configured budget");
    this.#reservedUsd += estimatedCostUsd;
    return generate(provider, request, options);
  }
}

export interface ProviderContext {
  signal: AbortSignal;
}

export interface Provider {
  readonly id: string;
  readonly capabilities: readonly ("text" | "streaming" | "tools" | "vision")[];
  generate(request: ProviderRequest, context: ProviderContext): Promise<ProviderResponse>;
}

export type ProviderCapability = "text" | "streaming" | "tools" | "vision";

/** Returns the first provider that declares every required capability. */
export function selectCapableProvider(providers: readonly Provider[], required: readonly ProviderCapability[]): Provider {
  if (required.length === 0) throw new ProviderError("INVALID_REQUEST", "at least one capability is required");
  const provider = providers.find((candidate) => required.every((capability) => candidate.capabilities.includes(capability)));
  if (!provider) throw new ProviderError("UNAVAILABLE", `no configured provider supports required capabilities: ${required.join(", ")}`);
  return provider;
}

export type DataClassification = "public" | "internal" | "sensitive" | "restricted";

export interface FallbackCandidate {
  provider: Provider;
  maxDataClassification: DataClassification;
  maxCostUsd: number;
}

export interface FallbackConstraints {
  dataClassification: DataClassification;
  maxCostUsd: number;
}

/** Chooses a fallback only when it preserves the original data and cost limits. */
export function selectSafeFallback(
  primaryProviderId: string,
  candidates: readonly FallbackCandidate[],
  constraints: FallbackConstraints,
): Provider {
  const rank: Record<DataClassification, number> = { public: 0, internal: 1, sensitive: 2, restricted: 3 };
  if (!(constraints.dataClassification in rank) || !Number.isFinite(constraints.maxCostUsd) || constraints.maxCostUsd < 0) {
    throw new ProviderError("INVALID_REQUEST", "fallback data classification and cost limit are invalid");
  }
  const selected = candidates.find(({ provider, maxDataClassification, maxCostUsd }) =>
    provider.id !== primaryProviderId &&
    maxDataClassification in rank && rank[maxDataClassification] >= rank[constraints.dataClassification] &&
    Number.isFinite(maxCostUsd) && maxCostUsd >= 0 && maxCostUsd <= constraints.maxCostUsd,
  );
  if (!selected) throw new ProviderError("UNAVAILABLE", "no fallback provider satisfies the original data and cost limits");
  return selected.provider;
}

export interface ProviderCatalogEntry {
  providerId: string;
  modelId: string;
  capabilities: readonly ("text" | "streaming" | "tools" | "vision")[];
  source: string;
  observedAt: string;
}

/** Builds a provenance-bearing snapshot; it does not claim live verification. */
export function createProviderCatalogEntry(entry: ProviderCatalogEntry): ProviderCatalogEntry {
  if (!entry.providerId.trim() || !entry.modelId.trim() || !entry.source.trim()) {
    throw new ProviderError("INVALID_REQUEST", "providerId, modelId and source must not be empty");
  }
  const observedTimestamp = Date.parse(`${entry.observedAt}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.observedAt) || Number.isNaN(observedTimestamp) || new Date(observedTimestamp).toISOString().slice(0, 10) !== entry.observedAt) {
    throw new ProviderError("INVALID_REQUEST", "observedAt must be a valid YYYY-MM-DD date");
  }
  const allowed = new Set(["text", "streaming", "tools", "vision"]);
  if (entry.capabilities.length === 0 || entry.capabilities.some((capability) => !allowed.has(capability)) || new Set(entry.capabilities).size !== entry.capabilities.length) {
    throw new ProviderError("INVALID_REQUEST", "capabilities must be non-empty, known and unique");
  }
  return { ...entry, capabilities: [...entry.capabilities] };
}

export interface GenerateOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export type ExecutionMode = "host" | "standalone" | "headless" | "offline";

export interface ModelControl {
  controller: "host" | "ases-provider" | "ases-mock";
  selection: "host-managed" | "provider-managed" | "fixed-mock";
  canSelectModel: boolean;
}

/** Describes who controls model selection; host mode never claims host control. */
export function getModelControl(mode: ExecutionMode): ModelControl {
  if (mode === "host") return { controller: "host", selection: "host-managed", canSelectModel: false };
  if (mode === "offline") return { controller: "ases-mock", selection: "fixed-mock", canSelectModel: false };
  return { controller: "ases-provider", selection: "provider-managed", canSelectModel: true };
}

/** Selects a provider without allowing an offline project to reach a remote adapter. */
export async function generateForMode(
  mode: ExecutionMode,
  request: ProviderRequest,
  options: GenerateOptions & { provider?: Provider } = {},
): Promise<ProviderResponse> {
  if (mode === "offline") return generate(new MockProvider(), request, options);
  if (!options.provider) throw new ProviderError("UNAVAILABLE", `no provider configured for ${mode} mode`);
  return generate(options.provider, request, options);
}

/** Calls a provider with bounded time and normalized errors. */
export async function generate(provider: Provider, request: ProviderRequest, options: GenerateOptions = {}): Promise<ProviderResponse> {
  if (!request.prompt.trim()) throw new ProviderError("INVALID_REQUEST", "prompt must not be empty");
  if (request.maxOutputTokens !== undefined && (!Number.isInteger(request.maxOutputTokens) || request.maxOutputTokens < 1)) {
    throw new ProviderError("INVALID_REQUEST", "maxOutputTokens must be a positive integer");
  }
  if (options.signal?.aborted) throw new ProviderError("CANCELLED", "provider request was cancelled");

  const timeoutMs = options.timeoutMs ?? 30_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new ProviderError("INVALID_REQUEST", "timeoutMs must be positive");
  const controller = new AbortController();
  let rejectAbort!: (error: ProviderError) => void;
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const cancel = () => {
    rejectAbort(new ProviderError("CANCELLED", "provider request was cancelled"));
    controller.abort();
  };
  options.signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    rejectAbort(new ProviderError("TIMEOUT", `provider request exceeded ${timeoutMs}ms`));
    controller.abort();
  }, timeoutMs);

  try {
    return await Promise.race([provider.generate(request, { signal: controller.signal }), aborted]);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("PROVIDER_FAILURE", "provider request failed", { cause: error });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
  }
}

/** Deterministic, offline provider intended for tests and local dry runs. */
export class MockProvider implements Provider {
  readonly id = "mock";
  readonly capabilities = ["text"] as const;

  async generate(request: ProviderRequest, context: ProviderContext): Promise<ProviderResponse> {
    if (context.signal.aborted) throw new ProviderError("CANCELLED", "provider request was cancelled");
    const text = `Mock response: ${request.prompt.trim()}`;
    return {
      text,
      provider: this.id,
      model: "deterministic-v1",
      usage: { inputTokens: request.prompt.trim().split(/\s+/).length, outputTokens: text.split(/\s+/).length },
    };
  }
}

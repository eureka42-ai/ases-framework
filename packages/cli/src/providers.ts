export type ProviderErrorCode = "INVALID_REQUEST" | "TIMEOUT" | "CANCELLED" | "UNAVAILABLE" | "PROVIDER_FAILURE";

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

export interface ProviderContext {
  signal: AbortSignal;
}

export interface Provider {
  readonly id: string;
  readonly capabilities: readonly ("text" | "streaming" | "tools" | "vision")[];
  generate(request: ProviderRequest, context: ProviderContext): Promise<ProviderResponse>;
}

export interface GenerateOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
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

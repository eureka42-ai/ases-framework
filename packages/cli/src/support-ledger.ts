import { randomUUID } from "node:crypto";

export type IncidentSeverity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export interface SlaTarget { firstResponseMinutes: number; resolutionMinutes: number }
export type SlaPolicy = Readonly<Record<IncidentSeverity, SlaTarget>>;
export interface SupportIncidentEvent { type: "OPENED" | "ACKNOWLEDGED" | "RESOLVED"; at: string; actorId: string }
export interface SupportIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  openedAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  events: SupportIncidentEvent[];
}
export interface SupportIncidentView extends SupportIncident {
  firstResponseDeadline: string;
  resolutionDeadline: string;
  firstResponseElapsedMs: number | null;
  resolutionElapsedMs: number;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
}

const SEVERITIES: IncidentSeverity[] = ["P1", "P2", "P3", "P4"];
const LIMIT_MINUTES = 525_600;

function toIso(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new TypeError("support ledger clock returned an invalid date");
  return date.toISOString();
}

function validatePolicy(policy: SlaPolicy): void {
  if (!policy || SEVERITIES.some((severity) => !policy[severity])) throw new TypeError("SLA policy must define P1, P2, P3 and P4 targets");
  for (const severity of SEVERITIES) {
    const target = policy[severity];
    if (![target.firstResponseMinutes, target.resolutionMinutes].every((value) => Number.isSafeInteger(value) && value > 0 && value <= LIMIT_MINUTES)) throw new TypeError(`SLA targets for ${severity} must be positive bounded whole minutes`);
    if (target.firstResponseMinutes > target.resolutionMinutes) throw new TypeError(`first response target cannot exceed resolution target for ${severity}`);
  }
}

/** In-memory support ledger that measures response/resolution SLAs without sending alerts or data remotely. */
export function createSupportLedger(policy: SlaPolicy, clock: () => Date = () => new Date()) {
  validatePolicy(policy);
  const targets = Object.fromEntries(SEVERITIES.map((severity) => [severity, { ...policy[severity] }])) as Record<IncidentSeverity, SlaTarget>;
  const incidents = new Map<string, SupportIncident>();

  function view(incident: SupportIncident, now: Date): SupportIncidentView {
    const current = now.getTime();
    const opened = Date.parse(incident.openedAt);
    const target = targets[incident.severity];
    const firstResponseMs = target.firstResponseMinutes * 60_000;
    const resolutionMs = target.resolutionMinutes * 60_000;
    const responseAt = incident.firstResponseAt ? Date.parse(incident.firstResponseAt) : null;
    const resolvedAt = incident.resolvedAt ? Date.parse(incident.resolvedAt) : null;
    const responseMeasureAt = responseAt ?? (incident.status === "RESOLVED" ? resolvedAt : current);
    const resolutionMeasureAt = resolvedAt ?? current;
    const events = incident.events.map((event) => ({ ...event }));
    return {
      ...incident,
      events,
      firstResponseDeadline: new Date(opened + firstResponseMs).toISOString(),
      resolutionDeadline: new Date(opened + resolutionMs).toISOString(),
      firstResponseElapsedMs: responseAt === null ? (responseMeasureAt === null ? null : responseMeasureAt - opened) : responseAt - opened,
      resolutionElapsedMs: resolutionMeasureAt - opened,
      firstResponseBreached: responseAt === null ? responseMeasureAt! - opened > firstResponseMs : responseAt - opened > firstResponseMs,
      resolutionBreached: resolutionMeasureAt - opened > resolutionMs,
    };
  }

  function get(id: string): SupportIncidentView | undefined {
    const incident = incidents.get(id);
    return incident ? view(incident, clock()) : undefined;
  }

  return Object.freeze({
    open(input: { title: string; severity: IncidentSeverity; actorId: string }): SupportIncidentView {
      if (!SEVERITIES.includes(input.severity) || typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 200 || typeof input.actorId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._@-]{0,127}$/.test(input.actorId)) throw new TypeError("incident title, severity and actor ID are required and bounded");
      const now = toIso(clock());
      const incident: SupportIncident = {
        id: randomUUID(), title: input.title.trim(), severity: input.severity, status: "OPEN", openedAt: now,
        firstResponseAt: null, resolvedAt: null, events: [{ type: "OPENED", at: now, actorId: input.actorId }],
      };
      incidents.set(incident.id, incident);
      return view(incident, new Date(now));
    },
    acknowledge(id: string, actorId: string): SupportIncidentView {
      const incident = incidents.get(id);
      if (!incident || incident.status !== "OPEN") throw new Error("incident transition not allowed");
      if (!/^[A-Za-z0-9][A-Za-z0-9._@-]{0,127}$/.test(actorId)) throw new TypeError("actor ID is invalid");
      const now = toIso(clock());
      incident.status = "ACKNOWLEDGED";
      incident.firstResponseAt = now;
      incident.events.push({ type: "ACKNOWLEDGED", at: now, actorId });
      return view(incident, new Date(now));
    },
    resolve(id: string, actorId: string): SupportIncidentView {
      const incident = incidents.get(id);
      if (!incident || incident.status === "RESOLVED") throw new Error("incident transition not allowed");
      if (!/^[A-Za-z0-9][A-Za-z0-9._@-]{0,127}$/.test(actorId)) throw new TypeError("actor ID is invalid");
      const now = toIso(clock());
      incident.status = "RESOLVED";
      incident.firstResponseAt ??= now;
      incident.resolvedAt = now;
      incident.events.push({ type: "RESOLVED", at: now, actorId });
      return view(incident, new Date(now));
    },
    get,
    list(): SupportIncidentView[] {
      const now = clock();
      return [...incidents.values()].map((incident) => view(incident, now)).sort((a, b) => a.openedAt.localeCompare(b.openedAt) || a.id.localeCompare(b.id));
    },
  });
}

import { randomUUID } from "node:crypto";

export type AgentMessageType = "task.request" | "task.result" | "task.error" | "context.request" | "context.response";
export interface AgentAclRule { fromAgent: string; toAgent: string; projectId: string; messageTypes: readonly AgentMessageType[] }
export interface A2AMessage {
  schemaVersion: "1";
  messageId: string;
  conversationId: string;
  projectId: string;
  fromAgent: string;
  toAgent: string;
  type: AgentMessageType;
  createdAt: string;
  expiresAt: string;
  payload: unknown;
}
export interface ReceivedA2AMessage { trust: "untrusted-data"; message: A2AMessage }
export class AgentAclError extends Error {
  constructor(message: string) { super(message); this.name = "AgentAclError"; }
}

const messageTypes = new Set<AgentMessageType>(["task.request", "task.result", "task.error", "context.request", "context.response"]);
const validAgentId = (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,127}$/.test(value);

/** Creates an in-process, single-project A2A mailbox. Messages never execute their payload. */
export function createAgentMessageBus(options: {
  projectId: string;
  agents: readonly string[];
  acl: readonly AgentAclRule[];
  maxMessageBytes?: number;
  maxQueueSize?: number;
  now?: () => number;
}) {
  const agentSet = new Set(options.agents);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,127}$/.test(options.projectId) || !agentSet.size || agentSet.size !== options.agents.length || [...agentSet].some((id) => !validAgentId(id))) throw new Error("invalid or duplicate A2A project/agent ID");
  for (const rule of options.acl) {
    if (!agentSet.has(rule.fromAgent) || !agentSet.has(rule.toAgent) || rule.projectId !== options.projectId || !rule.messageTypes.length || rule.messageTypes.some((type) => !messageTypes.has(type))) throw new Error("invalid A2A ACL rule; agents, project and message types must be explicit");
  }
  const acl = options.acl.map((rule) => ({ ...rule, messageTypes: [...rule.messageTypes] }));
  const maxBytes = options.maxMessageBytes ?? 64 * 1024;
  const maxQueue = options.maxQueueSize ?? 100;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1024 * 1024 || !Number.isSafeInteger(maxQueue) || maxQueue < 1 || maxQueue > 10_000) throw new Error("A2A queue limits are invalid");
  const now = options.now ?? Date.now;
  const queues = new Map<string, A2AMessage[]>([...agentSet].map((id) => [id, []]));

  function agent(agentId: string) {
    if (!agentSet.has(agentId)) throw new AgentAclError("agent is not registered in this project");
    return {
      send(toAgent: string, type: AgentMessageType, payload: unknown, input: { conversationId?: string; ttlMs?: number } = {}): A2AMessage {
        if (!agentSet.has(toAgent)) throw new AgentAclError("recipient is outside this project");
        if (!messageTypes.has(type)) throw new AgentAclError("unknown A2A message type");
        const rule = acl.find((item) => item.fromAgent === agentId && item.toAgent === toAgent && item.projectId === options.projectId && item.messageTypes.includes(type));
        if (!rule) throw new AgentAclError("A2A message denied by default: no matching project ACL rule");
        const ttlMs = input.ttlMs ?? 300_000;
        if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > 3_600_000) throw new Error("A2A message TTL must be from 1 ms to 1 hour");
        const conversationId = input.conversationId ?? randomUUID();
        if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(conversationId)) throw new Error("A2A conversation ID must be a bounded identifier");
        const created = now();
        const body = JSON.stringify(payload);
        if (body === undefined || Buffer.byteLength(body) > maxBytes) throw new Error(`A2A payload exceeds the ${maxBytes} byte limit or is not JSON-serializable`);
        const queue = queues.get(toAgent)!;
        while (queue[0] && Date.parse(queue[0].expiresAt) <= created) queue.shift();
        if (queue.length >= maxQueue) throw new Error("A2A recipient queue is full");
        const message: A2AMessage = {
          schemaVersion: "1", messageId: randomUUID(), conversationId,
          projectId: options.projectId, fromAgent: agentId, toAgent, type,
          createdAt: new Date(created).toISOString(), expiresAt: new Date(created + ttlMs).toISOString(),
          payload: JSON.parse(body) as unknown
        };
        queue.push(message);
        return structuredClone(message);
      },
      receive(): ReceivedA2AMessage | undefined {
        const queue = queues.get(agentId)!;
        const timestamp = now();
        while (queue[0] && Date.parse(queue[0].expiresAt) <= timestamp) queue.shift();
        const message = queue.shift();
        return message ? { trust: "untrusted-data", message: structuredClone(message) } : undefined;
      },
      pending(): number {
        const queue = queues.get(agentId)!;
        const timestamp = now();
        while (queue[0] && Date.parse(queue[0].expiresAt) <= timestamp) queue.shift();
        return queue.length;
      }
    };
  }
  return { projectId: options.projectId, agent };
}

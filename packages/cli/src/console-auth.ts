import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { createServer, type Server } from "node:http";
import express, { type Express, type Request } from "express";

export type ConsoleRole = "reader" | "contributor" | "admin";
export type ConsoleAction = "read" | "write" | "admin";
export interface ConsoleMembership { organizationId: string; repositoryId: string; role: ConsoleRole }
export interface ConsoleUserRecord { principalId: string; username: string; displayName: string; passwordHash: string; memberships: readonly ConsoleMembership[] }
export type TrustedConsoleIdentity = Omit<Pick<ConsoleSession, "principalId" | "username" | "displayName" | "memberships">, "memberships"> & { memberships: readonly ConsoleMembership[] };
export interface ConsoleSession { principalId: string; username: string; displayName: string; memberships: ConsoleMembership[]; expiresAt: string }
export interface ConsoleAuthOptions { sessionTtlMs?: number; maxLoginAttempts?: number; loginWindowMs?: number }
export interface LocalConsoleOptions extends ConsoleAuthOptions {
  users: readonly ConsoleUserRecord[];
  renderDashboard: (session: ConsoleSession) => string | Promise<string>;
  port?: number;
}

const SESSION_COOKIE = "ases_console";
const HASH_COST = 16_384;
const HASH_BYTES = 64;
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/;
const SOURCE_HASH = /^scrypt\$16384\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{86})$/;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, HASH_BYTES, { N: HASH_COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key as Buffer)));
}

/** Creates a scrypt credential for provisioning a local console account. Store only the returned hash. */
export async function hashConsolePassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length < 12 || password.length > 256) throw new TypeError("console password must be 12 to 256 characters");
  const salt = randomBytes(16);
  const digest = await derive(password, salt);
  return `scrypt$${HASH_COST}$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

function validateUsers(users: readonly ConsoleUserRecord[]): ConsoleUserRecord[] {
  const principals = new Set<string>();
  const usernames = new Set<string>();
  for (const user of users) {
    if (!ID.test(user.principalId) || !/^[A-Za-z0-9][A-Za-z0-9._@+-]{1,127}$/.test(user.username) || !user.displayName.trim() || user.displayName.length > 120 || !SOURCE_HASH.test(user.passwordHash)) throw new TypeError("console user record is invalid");
    const name = user.username.toLocaleLowerCase("en-US");
    if (principals.has(user.principalId) || usernames.has(name)) throw new TypeError("console principals and usernames must be unique");
    principals.add(user.principalId);
    usernames.add(name);
    const membershipKeys = new Set<string>();
    for (const membership of user.memberships) {
      const key = `${membership.organizationId}/${membership.repositoryId}`;
      if (!ID.test(membership.organizationId) || !ID.test(membership.repositoryId) || !["reader", "contributor", "admin"].includes(membership.role) || membershipKeys.has(key)) throw new TypeError("console memberships must use unique repository roles");
      membershipKeys.add(key);
    }
  }
  return users.map((user) => ({ ...user, memberships: user.memberships.map((membership) => ({ ...membership })) }));
}

function copySession(session: ConsoleSession): ConsoleSession {
  return { ...session, memberships: session.memberships.map((membership) => ({ ...membership })) };
}

export function createConsoleAuth(users: readonly ConsoleUserRecord[], options: ConsoleAuthOptions = {}) {
  const records = validateUsers(users);
  const sessionTtlMs = options.sessionTtlMs ?? 8 * 60 * 60 * 1000;
  if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs < 60_000 || sessionTtlMs > 24 * 60 * 60 * 1000) throw new TypeError("console session TTL must be between one minute and 24 hours");
  const sessions = new Map<string, ConsoleSession>();

  function createSession(identity: TrustedConsoleIdentity, now: number): { token: string; session: ConsoleSession } {
    if (!ID.test(identity.principalId) || !/^[A-Za-z0-9][A-Za-z0-9._@+-]{1,127}$/.test(identity.username) || !identity.displayName.trim() || identity.displayName.length > 120 || !Array.isArray(identity.memberships) || identity.memberships.length > 500) throw new TypeError("trusted console identity is invalid");
    const seen = new Set<string>();
    const memberships = identity.memberships.map((membership) => {
      const key = `${membership.organizationId}/${membership.repositoryId}`;
      if (!ID.test(membership.organizationId) || !ID.test(membership.repositoryId) || !["reader", "contributor", "admin"].includes(membership.role) || seen.has(key)) throw new TypeError("trusted console memberships are invalid");
      seen.add(key);
      return { ...membership };
    });
    for (const [key, session] of sessions) if (Date.parse(session.expiresAt) <= now) sessions.delete(key);
    const token = randomBytes(32).toString("base64url");
    const session: ConsoleSession = { principalId: identity.principalId, username: identity.username, displayName: identity.displayName, memberships, expiresAt: new Date(now + sessionTtlMs).toISOString() };
    sessions.set(createHash("sha256").update(token).digest("hex"), session);
    return { token, session: copySession(session) };
  }

  return Object.freeze({
    async login(username: string, password: string, now = Date.now()): Promise<{ token: string; session: ConsoleSession } | undefined> {
      if (typeof username !== "string" || typeof password !== "string" || username.length > 128 || password.length > 256) return undefined;
      const record = records.find((item) => item.username.toLocaleLowerCase("en-US") === username.toLocaleLowerCase("en-US"));
      const salt = record ? Buffer.from(SOURCE_HASH.exec(record.passwordHash)![1]!, "base64url") : Buffer.alloc(16);
      const expected = record ? Buffer.from(SOURCE_HASH.exec(record.passwordHash)![2]!, "base64url") : Buffer.alloc(HASH_BYTES);
      const actual = await derive(password, salt);
      const valid = timingSafeEqual(actual, expected) && Boolean(record);
      if (!valid || !record) return undefined;
      return createSession(record, now);
    },
    /** Creates a session only from identity data verified by a trusted upstream authentication adapter. */
    createTrustedSession(identity: TrustedConsoleIdentity, now = Date.now()): { token: string; session: ConsoleSession } { return createSession(identity, now); },
    getSession(token: string | undefined, now = Date.now()): ConsoleSession | undefined {
      if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined;
      const key = createHash("sha256").update(token).digest("hex");
      const session = sessions.get(key);
      if (!session) return undefined;
      if (Date.parse(session.expiresAt) <= now) { sessions.delete(key); return undefined; }
      return copySession(session);
    },
    logout(token: string | undefined): void {
      if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) sessions.delete(createHash("sha256").update(token).digest("hex"));
    },
    authorize(token: string | undefined, organizationId: string, repositoryId: string, action: ConsoleAction): ConsoleRole {
      const session = this.getSession(token);
      if (!session) throw new Error("console access denied");
      const role = session.memberships.find((item) => item.organizationId === organizationId && item.repositoryId === repositoryId)?.role;
      const allowed = role && (action === "read" || (action === "write" && role !== "reader") || (action === "admin" && role === "admin"));
      if (!allowed) throw new Error("console access denied");
      return role;
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]!);
}

function cookieValue(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const cookie of cookieHeader.split(";")) {
    const [name, ...value] = cookie.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=");
  }
  return undefined;
}

function loginPage(message = ""): string {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Eureka42 ASES sign in</title><main><h1>Eureka42 ASES</h1><h2>Sign in</h2>${message ? `<p role="alert">${escapeHtml(message)}</p>` : ""}<form method="post" action="/login"><label>Username <input name="username" autocomplete="username" required maxlength="128"></label><label>Password <input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button type="submit">Sign in</button></form></main></html>`;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.origin;
  if (!origin || !request.headers.host) return false;
  try { return new URL(origin).host === request.headers.host && new URL(origin).protocol === "http:"; } catch { return false; }
}

export function createLocalConsoleApp(options: LocalConsoleOptions): Express {
  if (!options || typeof options.renderDashboard !== "function") throw new TypeError("console dashboard renderer is required");
  const auth = createConsoleAuth(options.users, options);
  const app = express();
  const maxAttempts = options.maxLoginAttempts ?? 5;
  const loginWindowMs = options.loginWindowMs ?? 15 * 60 * 1000;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100 || !Number.isSafeInteger(loginWindowMs) || loginWindowMs < 60_000 || loginWindowMs > 60 * 60 * 1000) throw new TypeError("login rate limits are invalid");
  const attempts = new Map<string, { count: number; startedAt: number }>();
  app.disable("x-powered-by");
  app.use(express.urlencoded({ extended: false, limit: "8kb" }));
  app.use((_request, response, next) => {
    response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.get("/login", (_request, response) => response.type("html").send(loginPage()));
  app.post("/login", async (request, response) => {
    if (!sameOrigin(request)) return response.sendStatus(403);
    const key = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const state = attempts.get(key);
    if (state && now - state.startedAt < loginWindowMs && state.count >= maxAttempts) return response.status(429).type("html").send(loginPage("Too many attempts. Try again later."));
    if (!state || now - state.startedAt >= loginWindowMs) attempts.set(key, { count: 0, startedAt: now });
    const result = await auth.login(String(request.body?.username ?? ""), String(request.body?.password ?? ""), now);
    if (!result) {
      const current = attempts.get(key)!;
      current.count += 1;
      return response.status(401).type("html").send(loginPage("Invalid username or password."));
    }
    attempts.delete(key);
    response.cookie(SESSION_COOKIE, result.token, { httpOnly: true, sameSite: "strict", secure: false, path: "/", maxAge: Date.parse(result.session.expiresAt) - now });
    return response.redirect(303, "/");
  });
  app.post("/logout", (request, response) => {
    if (!sameOrigin(request)) return response.sendStatus(403);
    auth.logout(cookieValue(request));
    response.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "strict", secure: false, path: "/" });
    return response.redirect(303, "/login");
  });
  app.get("/api/me", (request, response) => {
    const session = auth.getSession(cookieValue(request));
    return session ? response.json({ principalId: session.principalId, displayName: session.displayName, memberships: session.memberships, expiresAt: session.expiresAt }) : response.sendStatus(401);
  });
  app.get("/api/organizations/:organizationId/repositories/:repositoryId/access", (request, response) => {
    const session = auth.getSession(cookieValue(request));
    if (!session) return response.sendStatus(401);
    try {
      const action = request.query.action;
      if (action !== "read" && action !== "write" && action !== "admin") return response.sendStatus(400);
      const role = auth.authorize(cookieValue(request), request.params.organizationId!, request.params.repositoryId!, action);
      return response.json({ organizationId: request.params.organizationId, repositoryId: request.params.repositoryId, action, role, allowed: true });
    } catch { return response.sendStatus(403); }
  });
  app.get("/", async (request, response) => {
    const session = auth.getSession(cookieValue(request));
    if (!session) return response.redirect(302, "/login");
    return response.type("html").send(await options.renderDashboard(copySession(session)));
  });
  return app;
}

/** Starts the multi-user console on loopback only; callers cannot expose this local-password mode on a network interface. */
export async function startLocalConsole(options: LocalConsoleOptions): Promise<{ server: Server; url: string }> {
  const port = options.port ?? 0;
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) throw new TypeError("console port is invalid");
  const server = createServer(createLocalConsoleApp(options));
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => { server.removeListener("error", reject); resolve(); });
  });
  const address = server.address();
  if (!address || typeof address === "string") { server.close(); throw new Error("console failed to bind a local TCP port"); }
  return { server, url: `http://127.0.0.1:${address.port}` };
}

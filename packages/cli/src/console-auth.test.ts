import assert from "node:assert/strict";
import test from "node:test";
import { createConsoleAuth, hashConsolePassword, startLocalConsole, type ConsoleUserRecord } from "./console-auth.js";

async function user(principalId: string, role: "reader" | "contributor" | "admin"): Promise<ConsoleUserRecord> {
  return {
    principalId, username: `${principalId}@example.test`, displayName: `User ${principalId}`,
    passwordHash: await hashConsolePassword("Strong local password 2026!"),
    memberships: [{ organizationId: "acme", repositoryId: "project", role }],
  };
}

test("console authentication isolates sessions and enforces exact repository roles", async () => {
  const users = [await user("reader-1", "reader"), await user("writer-1", "contributor"), await user("admin-1", "admin")];
  const auth = createConsoleAuth(users, { sessionTtlMs: 60_000 });
  assert.equal(await auth.login("unknown@example.test", "Strong local password 2026!"), undefined);
  assert.equal(await auth.login("reader-1@example.test", "incorrect password"), undefined);
  const login = await auth.login("READER-1@EXAMPLE.TEST", "Strong local password 2026!");
  assert.ok(login);
  assert.equal(auth.getSession(login.token)?.principalId, "reader-1");
  assert.equal(auth.authorize(login.token, "acme", "project", "read"), "reader");
  assert.throws(() => auth.authorize(login.token, "acme", "project", "write"), /access denied/);
  assert.throws(() => auth.authorize(login.token, "other", "project", "read"), /access denied/);
  const admin = await auth.login("admin-1@example.test", "Strong local password 2026!");
  assert.ok(admin);
  assert.equal(auth.authorize(admin.token, "acme", "project", "admin"), "admin");
  auth.logout(login.token);
  assert.equal(auth.getSession(login.token), undefined);
  assert.throws(() => auth.authorize(login.token, "acme", "project", "admin"), /access denied/);
});

test("local console serves authenticated dashboard only on loopback and revokes its cookie at logout", async () => {
  const account = await user("operator-1", "contributor");
  const app = await startLocalConsole({ users: [account], renderDashboard: (session) => `<h1>${session.displayName}</h1>` });
  try {
    assert.match(app.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    const loginPage = await fetch(`${app.url}/`, { redirect: "manual" });
    assert.equal(loginPage.status, 302);
    assert.equal(loginPage.headers.get("location"), "/login");
    const headers = { "content-type": "application/x-www-form-urlencoded", origin: app.url };
    const login = await fetch(`${app.url}/login`, { method: "POST", headers, body: new URLSearchParams({ username: account.username, password: "Strong local password 2026!" }), redirect: "manual" });
    assert.equal(login.status, 303);
    assert.match(login.headers.get("set-cookie") ?? "", /HttpOnly/);
    assert.match(login.headers.get("set-cookie") ?? "", /SameSite=Strict/);
    const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0]!;
    assert.ok(cookie.startsWith("ases_console="));
    const page = await fetch(`${app.url}/`, { headers: { cookie } });
    assert.equal(page.status, 200);
    assert.match(await page.text(), /User operator-1/);
    const role = await fetch(`${app.url}/api/organizations/acme/repositories/project/access?action=write`, { headers: { cookie } });
    assert.equal(role.status, 200);
    assert.equal((await role.json() as { role: string }).role, "contributor");
    const denied = await fetch(`${app.url}/api/organizations/other/repositories/project/access?action=read`, { headers: { cookie } });
    assert.equal(denied.status, 403);
    const logout = await fetch(`${app.url}/logout`, { method: "POST", headers: { cookie, origin: app.url }, redirect: "manual" });
    assert.equal(logout.status, 303);
    assert.equal((await fetch(`${app.url}/api/me`, { headers: { cookie } })).status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve()));
  }
});

test("local console rejects cross-origin login and throttles repeated failures", async () => {
  const account = await user("throttle-1", "reader");
  const app = await startLocalConsole({ users: [account], maxLoginAttempts: 1, renderDashboard: () => "<main>private</main>" });
  try {
    const crossOrigin = await fetch(`${app.url}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", origin: "http://attacker.example" }, body: "username=x&password=y" });
    assert.equal(crossOrigin.status, 403);
    const headers = { "content-type": "application/x-www-form-urlencoded", origin: app.url };
    const first = await fetch(`${app.url}/login`, { method: "POST", headers, body: "username=throttle-1%40example.test&password=wrong" });
    assert.equal(first.status, 401);
    const second = await fetch(`${app.url}/login`, { method: "POST", headers, body: "username=throttle-1%40example.test&password=wrong" });
    assert.equal(second.status, 429);
  } finally {
    await new Promise<void>((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve()));
  }
});

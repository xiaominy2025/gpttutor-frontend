import assert from "node:assert/strict";
import test from "node:test";
import { forecastingGuestSession } from "./alpha-advisor-guest.mjs";
import { createAlphaAdvisor } from "./alpha-advisor.mjs";
import { advisorSessionRoute } from "./management-advisor.js";

test("Forecasting guest cookies are isolated, signed, short-lived and reusable", () => {
  let now = Date.UTC(2026, 10, 22);
  const sessions = forecastingGuestSession(Buffer.alloc(32, 1), () => now);
  const request = cookie => new Request("https://fixture.test", { headers: { cookie } });
  const cookie = sessions.issue(request(""));
  assert.match(cookie, /; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=86400$/);
  const value = cookie.split(";")[0];
  assert.ok(sessions.actor(request(value)));
  assert.equal(sessions.issue(request(value)), null);
  assert.equal(sessions.actor(request(value + "; " + value)), null);
  assert.equal(sessions.actor(request(value.slice(0, -1) + (value.endsWith("a") ? "b" : "a"))), null);
  assert.equal(forecastingGuestSession(Buffer.alloc(32, 2), () => now).actor(request(value)), null);
  assert.equal(sessions.ip("2001:0db8::1"), sessions.ip("2001:db8::1"));
  assert.equal(sessions.ip("127.0.0.1, 203.0.113.1"), null);
  now += 86_400_000;
  assert.equal(sessions.actor(request(value)), null);
});

test("guest bootstrap requires exact origin and a trusted IP and obeys the master gate", async () => {
  const origin = "https://fixture.test";
  const now = () => Date.UTC(2026, 10, 22);
  let master = true;
  const handler = createAlphaAdvisor({
    enabled: true, providerBlocked: false, origin, now, startsAt: now(), endsAt: now() + 86_400_000,
    masterAllows: () => master, guestSession: forecastingGuestSession(Buffer.alloc(32, 1), now)
  });
  const request = (value = origin, cookie = "") => new Request(origin + advisorSessionRoute, {
    method: "POST", body: "{}", headers: { origin: value, "Content-Type": "application/json", cookie }
  });
  const context = { viewerIp: "192.0.2.1" };
  assert.equal((await handler(request(), {})).status, 503);
  assert.equal((await handler(request("https://wrong.test"), context)).status, 403);
  const result = await handler(request(), context);
  const cookie = result.headers.getSetCookie()[0].split(";")[0];
  assert.deepEqual(await result.json(), { ready: true });
  assert.equal((await handler(request(origin, cookie), context)).headers.has("Set-Cookie"), false);
  master = false;
  assert.equal((await handler(request(origin, cookie), context)).status, 503);
});

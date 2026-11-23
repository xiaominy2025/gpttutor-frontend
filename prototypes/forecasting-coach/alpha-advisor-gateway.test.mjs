import assert from "node:assert/strict";
import test from "node:test";
import { alphaAdvisorGateway } from "./alpha-advisor-gateway.mjs";
import { advisorRoute } from "./management-advisor.js";

const event = {
  version: "2.0", rawPath: advisorRoute, requestContext: { http: { method: "POST" } },
  headers: { origin: "https://d6owpirihdsus.cloudfront.net", "content-type": "application/json" },
  cookies: ["__Host-engent-email=fixture"], body: "e30=", isBase64Encoded: true
};

test("Alpha gateway preserves Origin and cookie for verification across API Gateway v2", async () => {
  const run = alphaAdvisorGateway(async request => {
    assert.equal(new URL(request.url).pathname, advisorRoute);
    assert.equal(request.headers.get("origin"), event.headers.origin);
    assert.equal(request.headers.get("cookie"), event.cookies[0]);
    assert.equal(await request.text(), "{}");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  });
  const response = await run(event);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["cache-control"], "no-store");
});

test("Alpha gateway rejects oversized or ambiguous input before the runtime", async () => {
  const run = alphaAdvisorGateway(() => assert.fail("Rejected event reached the runtime"));
  assert.equal((await run({ ...event, body: Buffer.alloc(4097).toString("base64") })).statusCode, 413);
  assert.equal((await run({ ...event, body: "€".repeat(2000), isBase64Encoded: false })).statusCode, 413);
  assert.equal((await run({ ...event, body: "%30=" })).statusCode, 400);
  assert.equal((await run({ ...event, headers: { ...event.headers, Origin: event.headers.origin } })).statusCode, 400);
  assert.equal((await run({ ...event, headers: { ...event.headers, cookie: "another=one" } })).statusCode, 400);
});

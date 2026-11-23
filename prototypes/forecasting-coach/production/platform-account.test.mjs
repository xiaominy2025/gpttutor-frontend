import assert from "node:assert/strict";
import test from "node:test";
import { releaseAAccount, releaseALogoutUrl } from "./platform-account.mjs";

const provider = "https://engent-platform-prod-771049112957.auth.us-east-1.amazoncognito.com";

test("production uses the Release A sign-in and managed logout responses", () => {
  assert.equal(releaseAAccount.login, "/api/platform/login");
  const logoutUrl = provider + "/logout?client_id=fixture&logout_uri=https%3A%2F%2Fwww.engentlabs.com%2Fexplore";
  assert.equal(releaseALogoutUrl({ logoutUrl }), logoutUrl);
});

test("production refuses Alpha logout receipts and unexpected redirect destinations", () => {
  assert.throws(() => releaseALogoutUrl({ ok: true, scope: "participating-browser" }));
  for (const logoutUrl of [provider + "/login", provider + ".example.com/logout", "http" + provider.slice(5) + "/logout"]) {
    assert.throws(() => releaseALogoutUrl({ logoutUrl }));
  }
});

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const guestCookie = "__Host-forecasting-alpha";
const daySeconds = 86_400;

export function forecastingGuestSession(secret, now = Date.now) {
  if (!Buffer.isBuffer(secret) || secret.length < 32) throw new Error("Invalid Forecasting signing key.");
  const digest = (purpose, value) => createHmac("sha256", secret).update(purpose + "\0" + value).digest("base64url");
  function actor(request) {
    const cookies = (request.headers.get("cookie") ?? "").split(";").map(part => part.trim());
    const values = cookies.filter(part => part.startsWith(guestCookie + "="));
    if (values.length !== 1) return null;
    const value = values[0].slice(guestCookie.length + 1);
    const match = /^([A-Za-z0-9_-]{32})\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(value);
    if (!match) return null;
    const [, id, expiry, signature] = match;
    const time = Math.floor(now() / 1000);
    if (+expiry <= time || +expiry > time + daySeconds) return null;
    const expected = digest("cookie", id + "." + expiry);
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? digest("actor", id) : null;
  }
  return {
    actor,
    issue(request) {
      if (actor(request)) return null;
      const value = randomBytes(24).toString("base64url") + "." + (Math.floor(now() / 1000) + daySeconds);
      return guestCookie + "=" + value + "." + digest("cookie", value) +
        "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=" + daySeconds;
    },
    ip(value) {
      if (typeof value !== "string" || !isIP(value)) return null;
      // Canonicalize equivalent IPv6 spellings before assigning a quota bucket.
      const canonical = isIP(value) === 6 ? new URL("http://[" + value + "]").hostname : value;
      return digest("ip", canonical);
    }
  };
}

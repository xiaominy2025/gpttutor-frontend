import { Buffer } from "node:buffer";
import { advisorRoute, advisorSessionRoute, maxAdvisorBytes } from "./management-advisor.js";

const alphaOrigin = "https://d6owpirihdsus.cloudfront.net";

function reject(statusCode, code) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ error: { code } })
  };
}

export function alphaAdvisorGateway(handler, { trustedViewerIp = () => null, origin = alphaOrigin } = {}) {
  return async event => {
    if (event.version !== "2.0" || ![advisorRoute, advisorSessionRoute].includes(event.rawPath)) return reject(404, "route");
    if (event.requestContext?.http?.method !== "POST") return reject(405, "method");
    const body = event.body ?? "";
    if (typeof body !== "string") return reject(400, "invalid_summary");
    if (body.length > (event.isBase64Encoded ? Math.ceil(maxAdvisorBytes / 3) * 4 : maxAdvisorBytes)) {
      return reject(413, "too_large");
    }
    if (event.isBase64Encoded && !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body)) {
      return reject(400, "invalid_summary");
    }
    const bytes = Buffer.from(body, event.isBase64Encoded ? "base64" : "utf8");
    if (bytes.length > maxAdvisorBytes) return reject(413, "too_large");
    const headers = new Headers();
    const accepted = new Set(["origin", "content-type", "cookie"]);
    try {
      for (const [key, value] of Object.entries(event.headers ?? {})) {
        if (!accepted.has(key.toLowerCase())) continue;
        if (headers.has(key) || typeof value !== "string" || value.includes(",")) return reject(400, "headers");
        headers.set(key, value);
      }
      if (event.cookies?.length) {
        if (!Array.isArray(event.cookies) || headers.has("cookie") ||
            event.cookies.some(cookie => typeof cookie !== "string" || cookie.includes(","))) return reject(400, "headers");
        headers.set("cookie", event.cookies.join("; "));
      }
      const request = new Request(origin + event.rawPath, { method: "POST", headers, body: bytes });
      const result = await handler(request, { viewerIp: await trustedViewerIp(event) });
      const cookies = result.headers.getSetCookie();
      const responseHeaders = new Headers(result.headers);
      responseHeaders.delete("Set-Cookie");
      return { statusCode: result.status, headers: Object.fromEntries(responseHeaders),
        ...(cookies.length ? { cookies } : {}), body: await result.text() };
    } catch {
      return reject(503, "unavailable");
    }
  };
}

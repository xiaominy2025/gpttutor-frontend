import { randomUUID } from "node:crypto";
import { advisorModelInput, advisorRoute, advisorSessionRoute, maxAdvisorBytes } from "./management-advisor.js";

export const pilotLimits = Object.freeze({
  durationMs: 48 * 60 * 60 * 1000, daily: 5, perMinute: 2, ipDaily: 20, globalDaily: 100, concurrent: 2,
  budgetMicros: 1_000_000, inputTokens: 2048, outputTokens: 512
});

// Store reads must be strongly consistent. replace is a conditional write against
// the read revision (including conditional create on null), for one pilot record.
export function forecastingLedger(store, pilotId, { admissionLimit = Infinity } = {}) {
  if (!/^[a-z0-9-]{1,48}$/.test(pilotId)) throw new Error("Invalid pilot identifier.");
  const key = "FORECASTING#PILOT#" + pilotId;
  async function update(change) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const prior = await store.read(key);
      const state = prior?.value ?? { spent: 0, reserved: 0, requests: {}, leases: {} };
      const next = change(state);
      if (!next) return false;
      if (await store.replace(key, prior?.revision ?? null, next)) return true;
    }
    throw new Error("Forecasting ledger contention.");
  }
  return {
    async admit({ actor, ip, day, minute, reservation, id }) {
      if (!Number.isSafeInteger(reservation) || reservation <= 0) throw new Error("Invalid reservation.");
      if (!actor || !ip || !Number.isSafeInteger(minute)) throw new Error("Missing guest quota identifiers.");
      return update(state => {
        const actorSlot = day + "/actor/" + actor;
        const ipSlot = day + "/ip/" + ip;
        const globalSlot = day + "/global";
        const guest = state.requests[actorSlot] ?? { count: 0, minute: -1, recent: 0 };
        const recent = guest.minute === minute ? guest.recent : 0;
        const leases = Object.values(state.leases);
        if (state.paused || (state.admissions ?? 0) >= admissionLimit ||
            state.spent + state.reserved + reservation > pilotLimits.budgetMicros ||
            guest.count >= pilotLimits.daily || recent >= pilotLimits.perMinute ||
            (state.requests[ipSlot] ?? 0) >= pilotLimits.ipDaily ||
            (state.requests[globalSlot] ?? 0) >= pilotLimits.globalDaily || leases.length >= pilotLimits.concurrent ||
            leases.some(lease => lease.actor === actor) || Object.hasOwn(state.leases, id)) return null;
        return {
          ...state, admissions: (state.admissions ?? 0) + 1, reserved: state.reserved + reservation,
          requests: { ...state.requests, [actorSlot]: { count: guest.count + 1, minute, recent: recent + 1 },
            [ipSlot]: (state.requests[ipSlot] ?? 0) + 1, [globalSlot]: (state.requests[globalSlot] ?? 0) + 1 },
          leases: { ...state.leases, [id]: { actor, reservation } }
        };
      });
    },
    async settle(id, cost, pause = false) {
      if (!Number.isSafeInteger(cost) || cost < 0) throw new Error("Invalid model charge.");
      return update(state => {
        const lease = state.leases[id];
        if (!lease) return null;
        const leases = { ...state.leases };
        delete leases[id];
        return {
          ...state, leases, spent: state.spent + cost, reserved: state.reserved - lease.reservation,
          paused: Boolean(state.paused || pause || cost > lease.reservation)
        };
      });
    }
  };
}

const error = (status, code) => Response.json({ error: { code } }, {
  status, headers: { "Cache-Control": "no-store" }
});

async function readSummary(request) {
  const reader = request.body?.getReader();
  if (!reader) return error(400, "invalid_summary");
  const bytes = new Uint8Array(maxAdvisorBytes);
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (length + value.byteLength > bytes.byteLength) {
        await reader.cancel();
        return error(413, "too_large");
      }
      bytes.set(value, length);
      length += value.byteLength;
    }
    return advisorModelInput(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length))));
  } catch {
    return error(400, "invalid_summary");
  }
}

// viewerIp must come from the verified deployment boundary, never a request header.
export function createAlphaAdvisor({
  enabled = false, providerBlocked = true, origin, startsAt, endsAt,
  guestSession, masterAllows, ledger, provider, now = Date.now
} = {}) {
  const configured = typeof origin === "string" && origin.startsWith("https://") &&
    guestSession &&
    Number.isSafeInteger(startsAt) && Number.isSafeInteger(endsAt) &&
    endsAt > startsAt && endsAt - startsAt <= pilotLimits.durationMs && startsAt % 86_400_000 === 0;
  const inWindow = () => now() >= startsAt && now() < endsAt;
  const unavailable = () => error(503, "unavailable");
  return async (request, { viewerIp } = {}) => {
    const path = new URL(request.url).pathname;
    if (path !== advisorRoute && path !== advisorSessionRoute) return error(404, "route");
    if (request.method !== "POST") return error(405, "method");
    if (!enabled || !configured || !inWindow()) return unavailable();
    if (request.headers.get("origin") !== origin) return error(403, "origin");
    if (request.headers.get("content-type") !== "application/json") return error(415, "media_type");
    try {
      const ip = guestSession.ip(viewerIp);
      if (!ip) return unavailable();
      if (path === advisorSessionRoute) {
        if (await request.text() !== "{}") return error(400, "invalid_summary");
        if (providerBlocked || await masterAllows() !== true) return unavailable();
        const headers = new Headers({ "Cache-Control": "no-store" });
        const cookie = guestSession.issue(request);
        if (cookie) headers.set("Set-Cookie", cookie);
        return Response.json({ ready: true }, { headers });
      }
      const actor = guestSession.actor(request);
      if (!actor) return error(401, "session");
      const input = await readSummary(request);
      if (input instanceof Response) return input;
      if (providerBlocked || await masterAllows() !== true) return unavailable();
      // A trusted, server-only provider adapter binds the pinned model, computes
      // a conservative input token bound and reserves at the configured rate.
      const plan = await provider.plan(input, pilotLimits.outputTokens);
      if (!Number.isSafeInteger(plan.inputBound) || plan.inputBound <= 0 ||
          !Number.isSafeInteger(plan.reservation) || plan.reservation <= 0) return unavailable();
      if (plan.inputBound > pilotLimits.inputTokens) return error(413, "token_limit");
      const id = randomUUID();
      const time = now();
      const day = new Date(time).toISOString().slice(0, 10);
      if (!await ledger.admit({ actor, ip, day, minute: Math.floor(time / 60_000),
        reservation: plan.reservation, id })) return error(429, "limit");
      let dispatch;
      try {
        const send = await provider.prepare(plan);
        if (await masterAllows() === true && inWindow()) dispatch = send;
      } catch { /* Nothing was dispatched. */ }
      if (!dispatch) {
        await ledger.settle(id, 0);
        return unavailable();
      }
      // Never retry. An ambiguous dispatch or accounting failure leaves its
      // reservation and concurrency slot held for the operator to reconcile.
      const { draft, cost, inputTokens, outputTokens } = await dispatch();
      const exceeded = inputTokens > plan.inputBound || outputTokens > pilotLimits.outputTokens;
      if (!await ledger.settle(id, cost, exceeded) || cost > plan.reservation || exceeded) return unavailable();
      if (typeof draft !== "string" || !draft.trim() || draft.length > 2000) return unavailable();
      return Response.json({ version: 1, requestId: id, draft }, {
        headers: { "Cache-Control": "no-store" }
      });
    } catch {
      return unavailable();
    }
  };
}

import { pilotLimits } from "../alpha-advisor.mjs";

export const monthlyBudgetMicros = 10_000_000;
export const productionLedgerKey = "FORECASTING#PROD";
export const verificationLedgerKey = "FORECASTING#PROD#VERIFY";
const validAmount = value => Number.isSafeInteger(value) && value >= 0;
const map = value => value && typeof value === "object" && !Array.isArray(value);
const token = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const validDay = day => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day);
const validMonth = month => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

function validateState(state) {
  if (!map(state) || !validDay(state.day) || !map(state.months) || !map(state.requests) ||
      !map(state.leases) || typeof state.paused !== "boolean" || typeof state.canaryUsed !== "boolean") {
    throw Error("Invalid Forecasting production ledger.");
  }
  const held = {};
  for (const lease of Object.values(state.leases)) {
    if (!token(lease?.actor) || !validMonth(lease.month) || !validAmount(lease.reservation) || lease.reservation === 0) {
      throw Error("Invalid Forecasting production lease.");
    }
    held[lease.month] = (held[lease.month] ?? 0) + lease.reservation;
  }
  if ([...Object.keys(state.months), ...Object.keys(held), state.day.slice(0, 7)].some(month => {
    const total = state.months[month];
    return !validMonth(month) || !validAmount(total?.spent) || !validAmount(total.reserved) || total.reserved !== (held[month] ?? 0);
  })) throw Error("Forecasting production reservations do not reconcile.");
  if (Object.entries(state.requests).some(([key, count]) => key.startsWith("actor/") ?
    !validAmount(count?.count) || !validAmount(count.minute) || !validAmount(count.recent) : !validAmount(count))) {
    throw Error("Invalid Forecasting production quotas.");
  }
}

export function monthlyLedger(store, { verification = false, canary = false, sharedBudget = false } = {}) {
  const key = verification ? verificationLedgerKey : productionLedgerKey;
  async function update(change) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const prior = await store.read(key);
      if (!prior || !Number.isSafeInteger(prior.revision) || prior.revision < 1) throw Error("Missing initialized Forecasting production ledger.");
      validateState(prior.value);
      const next = change(prior.value);
      if (!next) return false;
      const result = await store.replace(key, prior.revision, next.state, next.money);
      if (result === "denied") return false;
      if (result) return true;
    }
    throw Error("Forecasting production ledger contention.");
  }
  return {
    async admit({ actor, ip, day, minute, reservation, id }) {
      if (![actor, ip, id].every(token) || !validDay(day) || !validAmount(minute) || minute > 144_000_000_000 ||
          new Date(minute * 60_000).toISOString().slice(0, 10) !== day ||
          !validAmount(reservation) || reservation === 0) throw Error("Invalid Forecasting production admission.");
      return update(state => {
        if (day < state.day || state.paused || (canary && state.canaryUsed) || Object.hasOwn(state.leases, id)) return null;
        const month = day.slice(0, 7); // UTC admission month owns all subsequent settlement.
        const total = state.months[month] ?? { spent: 0, reserved: 0 };
        const requests = day === state.day ? state.requests : {};
        const actorKey = "actor/" + actor, ipKey = "ip/" + ip;
        const guest = requests[actorKey] ?? { count: 0, minute, recent: 0 };
        const recent = guest.minute === minute ? guest.recent : 0;
        const active = Object.values(state.leases);
        if (guest.minute > minute || guest.count >= pilotLimits.daily || recent >= pilotLimits.perMinute ||
            (requests[ipKey] ?? 0) >= pilotLimits.ipDaily || (requests.global ?? 0) >= pilotLimits.globalDaily ||
            active.length >= pilotLimits.concurrent || active.some(lease => lease.actor === actor) ||
            (!sharedBudget && total.spent + total.reserved + reservation > monthlyBudgetMicros)) return null;
        return { money: { month, id, reservation, minute, previouslyUsed: total.used === true ||
          total.spent > 0 || total.reserved > 0 }, state: {
          ...state, day, canaryUsed: state.canaryUsed || canary,
          months: { ...state.months, [month]: { ...total, used: true, reserved: total.reserved + reservation } },
          requests: { ...requests, [actorKey]: { count: guest.count + 1, minute, recent: recent + 1 },
            [ipKey]: (requests[ipKey] ?? 0) + 1, global: (requests.global ?? 0) + 1 },
          leases: { ...state.leases, [id]: { actor, month, reservation } }
        } };
      });
    },
    async settle(id, cost, pause = false) {
      if (!token(id) || !validAmount(cost)) throw Error("Invalid Forecasting production settlement.");
      return update(state => {
        const lease = state.leases[id];
        if (!lease) return null;
        const leases = { ...state.leases };
        delete leases[id];
        const total = state.months[lease.month];
        return { money: { month: lease.month, id, reservation: lease.reservation, cost, pause }, state: {
          ...state, leases, paused: state.paused || pause || cost > lease.reservation,
          months: { ...state.months, [lease.month]: { ...total, spent: total.spent + cost, reserved: total.reserved - lease.reservation } }
        } };
      });
    }
  };
}

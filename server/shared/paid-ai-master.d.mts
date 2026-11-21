export class PaidAiMasterError extends Error {status:503;code:'paid_ai_paused'|'paid_ai_master_unavailable';constructor(reason:'paused'|'unavailable');}
export function createPaidAiMasterGate(options?:{readState?:(options:{signal:AbortSignal})=>Promise<unknown>;timeoutMs?:number}):{assertEnabled():Promise<{revision:number}>};

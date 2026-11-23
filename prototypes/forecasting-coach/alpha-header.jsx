import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import EngentHeader, { useEngentAccountMenu } from "./EngentHeader.jsx";
import logoUrl from "./engent-logo.png";
import { releaseAAccount, releaseALogoutUrl } from "./production/platform-account.mjs";

const signIn = "/explore?entry=email";
const channelName = "engent-browser-session";

function Account({ state, error, logout, signingOut, production }) {
  const { closeMenu } = useEngentAccountMenu();
  return <>
    {state === "student" ? <>
      <button type="button" disabled={signingOut} onClick={async () => {
        if (await logout()) closeMenu();
      }}>Sign out of Engent Labs</button>
      <p>{production ? "Ends this platform session. Other open coach sessions can remain active." : "Signs out of Engent Labs in this browser."}</p>
    </> : <>
      <button type="button" onClick={() => closeMenu()}>Continue as Guest</button>
      <a className="engent-email-entry" href={production ? releaseAAccount.login : signIn}>{production ? "Sign in" : "Sign in with Email"}</a>
    </>}
    {error && <p role="alert">{error}</p>}
  </>;
}

function AlphaHeader({ homeUrl, production }) {
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const current = useRef("checking");
  const revision = useRef(0);
  const channel = useRef(null);
  const logoutPending = useRef(false);
  const publish = next => {
    if (current.current === next) return;
    current.current = next;
    setState(next);
    document.dispatchEvent(new CustomEvent("forecasting-account", { detail: next }));
  };
  useEffect(() => {
    async function refresh() {
      if (logoutPending.current) return;
      const version = ++revision.current;
      let next = "unavailable";
      try {
        const response = await fetch("/api/platform/session", {
          credentials: "same-origin", cache: "no-store", redirect: "error"
        });
        if (response.ok) {
          const status = await response.json();
          if (status.signedIn === true && (production || status.emailBridge === true)) next = "student";
          if (status.signedIn === false) next = "guest";
        }
      } catch { /* Account status stays unavailable. */ }
      if (version === revision.current) publish(next);
    }
    const onVisible = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    if (!production) try {
      channel.current = new BroadcastChannel(channelName);
      channel.current.onmessage = event => { if (event.data === "revoked") refresh(); };
    } catch { /* Focus and polling still revalidate. */ }
    const timer = setInterval(() => { if (current.current === "student") onVisible(); }, 30_000);
    refresh();
    return () => {
      revision.current++;
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      channel.current?.close();
    };
  }, [production]);

  async function logout() {
    logoutPending.current = true;
    revision.current++;
    setSigningOut(true);
    setError("");
    try {
      const response = await fetch("/api/platform/logout", {
        method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error",
        ...(!production && { headers: { "Content-Type": "application/json" }, body: "{}" })
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (production) {
        window.location.assign(releaseALogoutUrl(result));
        return true;
      }
      if (result.ok !== true || result.scope !== "participating-browser") throw new Error();
      publish("guest");
      try { channel.current?.postMessage("revoked"); } catch { /* Sign-out is already complete. */ }
      return true;
    } catch {
      setError("Sign-out is incomplete. Please retry.");
      return false;
    } finally {
      logoutPending.current = false;
      setSigningOut(false);
    }
  }

  const label = { checking: "Checking account…", guest: "Guest", student: "Student", unavailable: "Account unavailable" };
  return <EngentHeader logoUrl={logoUrl} homeUrl={homeUrl} pageName="Forecasting Coach"
    status={label[state]} navigation={<a href="/explore">Explore Tools</a>}>
    <Account state={state} error={error} logout={logout} signingOut={signingOut} production={production} />
  </EngentHeader>;
}

export function mountAlphaHeader(homeUrl = "/engent-alpha/", production = false) {
  const host = document.createElement("div");
  document.querySelector(".mast").replaceWith(host);
  createRoot(host).render(<AlphaHeader homeUrl={homeUrl} production={production} />);
}

export const releaseAAccount = { login: "/api/platform/login" };

export function releaseALogoutUrl(result) {
  const url = new URL(result.logoutUrl);
  if (url.origin !== "https://engent-platform-prod-771049112957.auth.us-east-1.amazoncognito.com" ||
      url.pathname !== "/logout" || url.username || url.password || url.hash) {
    throw Error("Unexpected platform logout location.");
  }
  return url.href;
}

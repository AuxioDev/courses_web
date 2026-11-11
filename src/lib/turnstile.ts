import "server-only";

// Cloudflare Turnstile: a challenge a person passes and a script does not. The browser widget puts a one-time token
// in the form; the server checks it with Cloudflare before anything is saved.
//
// Optional by design: without TURNSTILE_SECRET_KEY the check is skipped (local development, and the weeks before
// the keys exist) and the honeypot, the rate limits and the admin's review are what stand between a script and the
// office. Once the secret is set it is enforced, and a failure to reach Cloudflare refuses the form.
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileEnabled() {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(token: string, ip: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  // Tokens are at most a couple of KB; anything bigger is not one.
  if (!token || token.length > 4096) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  try {
    const response = await fetchImpl(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

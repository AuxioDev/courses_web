import { afterEach, describe, expect, it, vi } from "vitest";
import { turnstileEnabled, verifyTurnstile } from "../turnstile";

afterEach(() => vi.unstubAllEnvs());

const answer = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);

describe("verifyTurnstile", () => {
  it("is off, and lets everything through, without a secret", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchImpl = answer({ success: false });
    expect(turnstileEnabled()).toBe(false);
    expect(await verifyTurnstile("", "1.2.3.4", fetchImpl)).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  describe("with a secret", () => {
    it("accepts a token Cloudflare approves, sending the secret, the token and the address", async () => {
      vi.stubEnv("TURNSTILE_SECRET_KEY", "s3cret");
      const fetchImpl = answer({ success: true });
      expect(turnstileEnabled()).toBe(true);
      expect(await verifyTurnstile("tok-123", "203.0.113.7", fetchImpl)).toBe(true);
      const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
      const sent = new URLSearchParams(String(init.body));
      expect(Object.fromEntries(sent)).toEqual({ secret: "s3cret", response: "tok-123", remoteip: "203.0.113.7" });
    });

    it("leaves the address out when it is unknown", async () => {
      vi.stubEnv("TURNSTILE_SECRET_KEY", "s3cret");
      const fetchImpl = answer({ success: true });
      await verifyTurnstile("tok", "unknown", fetchImpl);
      expect(new URLSearchParams(String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body)).has("remoteip")).toBe(false);
    });

    it("refuses a missing, oversized or rejected token, and anything Cloudflare does not clearly approve", async () => {
      vi.stubEnv("TURNSTILE_SECRET_KEY", "s3cret");
      const never = answer({ success: true });
      expect(await verifyTurnstile("", "1.1.1.1", never)).toBe(false);
      expect(await verifyTurnstile("x".repeat(5000), "1.1.1.1", never)).toBe(false);
      expect(never).not.toHaveBeenCalled();

      expect(await verifyTurnstile("tok", "1.1.1.1", answer({ success: false, "error-codes": ["timeout-or-duplicate"] }))).toBe(false);
      expect(await verifyTurnstile("tok", "1.1.1.1", answer({}))).toBe(false);
      expect(await verifyTurnstile("tok", "1.1.1.1", answer({ success: "true" }))).toBe(false);
      expect(await verifyTurnstile("tok", "1.1.1.1", answer({ success: true }, false))).toBe(false);
    });

    it("refuses when Cloudflare cannot be reached", async () => {
      vi.stubEnv("TURNSTILE_SECRET_KEY", "s3cret");
      const down = vi.fn(async () => {
        throw new Error("network");
      });
      expect(await verifyTurnstile("tok", "1.1.1.1", down as unknown as typeof fetch)).toBe(false);
    });
  });
});

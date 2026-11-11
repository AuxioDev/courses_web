// X-Forwarded-For is whatever the client sent plus the proxies' additions, so its first entry can be
// forged to dodge the per-IP limits. Use only headers the platform sets itself: on Vercel,
// x-vercel-forwarded-for (overwritten at the edge); elsewhere x-real-ip, which a reverse proxy must set.
export function pickClientIp(get: (name: string) => string | null, onVercel: boolean) {
  if (onVercel) {
    const vercel = get("x-vercel-forwarded-for")?.split(",")[0].trim();
    if (vercel) return vercel;
  }
  return get("x-real-ip")?.trim() || "unknown";
}

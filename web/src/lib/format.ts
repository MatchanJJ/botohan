/** `0x1c4…9A3C`: first 5 and last 4 characters, as in docs/APP_FLOW.md. */
export function shortAddress(address: string | undefined): string {
  if (!address) return "";
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}

/** Rough time left: "2d 4h", "3h 12m", "12m 4s", "40s". */
export function formatDuration(seconds: bigint | number): string {
  const s = Math.max(0, Number(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export const plural = (n: bigint | number, word: string) => `${n} ${word}${n == 1 ? "" : "s"}`;

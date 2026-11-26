/** `0x1c4…9A3C`: first 5 and last 4 characters, as in docs/APP_FLOW.md. */
export function shortAddress(address: string | undefined): string {
  if (!address) return "";
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}

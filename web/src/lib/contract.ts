import { sepolia } from "wagmi/chains";
import { botohanAbi, botohanAddress } from "@/generated";

export const botohan = {
  abi: botohanAbi,
  address: botohanAddress[sepolia.id],
  chainId: sepolia.id,
} as const;

/** First block to search for events (TRD.md: NEXT_PUBLIC_DEPLOY_BLOCK). */
export const deployBlock = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || 0);

export const txUrl = (hash: string) => `${sepolia.blockExplorers.default.url}/tx/${hash}`;

export type PollStatus = "upcoming" | "open" | "closed";

/** Same rule as `Botohan.status()`, computed locally so it ticks without extra RPC calls. */
export function pollStatus(poll: { startsAt: bigint; endsAt: bigint }, now: number): PollStatus {
  const t = BigInt(now);
  if (t >= poll.endsAt) return "closed";
  if (t < poll.startsAt) return "upcoming";
  return "open";
}

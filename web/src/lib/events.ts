import type { Address, Hash, PublicClient } from "viem";
import { botohanAbi } from "../generated.ts";

export type Vote = {
  voter: Address;
  option: bigint;
  hash: Hash;
  block: bigint;
  logIndex: number;
  /** Unix seconds; undefined only if the block lookup failed. */
  time: number | undefined;
};

type Client = Pick<PublicClient, "getBlockNumber" | "getContractEvents" | "getBlock">;
type Options = { address: Address; fromBlock: bigint; pollId: bigint; voter?: Address; limit: number };

const FIRST_CHUNK = 10_000n;
const MIN_CHUNK = 500n;
// shortcut: caps one scan at ~MAX_REQUESTS × chunk blocks; raise it if polls run for many weeks.
const MAX_REQUESTS = 40;

export const voteKey = (v: Pick<Vote, "hash" | "logIndex">) => `${v.hash}:${v.logIndex}`;

/**
 * Newest-first VoteCast events for a poll (optionally one voter).
 * Scans back from the head in chunks because RPCs cap eth_getLogs ranges
 * (publicnode: 50k blocks; some free tiers much less). Halves the chunk when a range is refused.
 */
export async function recentVotes(client: Client, opts: Options): Promise<Vote[]> {
  const votes: Vote[] = [];
  let to = await client.getBlockNumber();
  let chunk = FIRST_CHUNK;

  for (let requests = 0; to >= opts.fromBlock && votes.length < opts.limit && requests < MAX_REQUESTS; requests++) {
    const from = to - chunk + 1n > opts.fromBlock ? to - chunk + 1n : opts.fromBlock;
    let logs;
    try {
      logs = await client.getContractEvents({
        abi: botohanAbi,
        address: opts.address,
        eventName: "VoteCast",
        args: { pollId: opts.pollId, voter: opts.voter },
        fromBlock: from,
        toBlock: to,
      });
    } catch (error) {
      if (chunk / 2n >= MIN_CHUNK) {
        chunk /= 2n;
        continue;
      }
      // Older history unavailable (e.g. a pruned node): keep the newer votes we already have.
      if (votes.length > 0) break;
      throw error;
    }
    votes.push(...logs.map(toVote).reverse());
    to = from - 1n;
  }

  const newest = votes.slice(0, opts.limit);
  await fillTimes(client, newest);
  return newest;
}

type VoteLog = {
  args: { voter?: Address; option?: bigint };
  transactionHash: Hash;
  blockNumber: bigint;
  logIndex: number;
  blockTimestamp?: bigint | null;
};

export function toVote(log: VoteLog): Vote {
  return {
    voter: log.args.voter!,
    option: log.args.option!,
    hash: log.transactionHash,
    block: log.blockNumber,
    logIndex: log.logIndex,
    time: log.blockTimestamp ? Number(log.blockTimestamp) : undefined,
  };
}

/** Not every RPC includes blockTimestamp in logs; look the blocks up instead. */
async function fillTimes(client: Client, votes: Vote[]) {
  const missing = [...new Set(votes.filter((v) => v.time === undefined).map((v) => v.block))];
  const times = new Map<bigint, number>();
  await Promise.all(
    missing.map(async (blockNumber) => {
      const block = await client.getBlock({ blockNumber }).catch(() => null);
      if (block) times.set(blockNumber, Number(block.timestamp));
    }),
  );
  for (const v of votes) v.time ??= times.get(v.block);
}

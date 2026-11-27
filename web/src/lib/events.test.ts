import assert from "node:assert/strict";
import { test } from "node:test";
import { recentVotes } from "./events.ts";

const address = "0x901fb78eC268f1c92a8a4D8a7f63bB43B6d3BD27";
const voter = (n: number) => `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

/** Fake RPC: one vote every 1,000 blocks from block 1,000 to 30,000; refuses ranges over maxRange. */
function fakeClient({ maxRange, head = 30_000n, timestamps = true }: { maxRange: bigint; head?: bigint; timestamps?: boolean }) {
  const calls: { from: bigint; to: bigint }[] = [];
  const all = Array.from({ length: 30 }, (_, i) => ({
    args: { pollId: 0n, voter: voter(i + 1), option: BigInt(i % 3) },
    transactionHash: `0x${(i + 1).toString(16).padStart(64, "0")}` as `0x${string}`,
    blockNumber: BigInt((i + 1) * 1000),
    logIndex: 0,
    blockTimestamp: timestamps ? BigInt((i + 1) * 1000 * 12) : undefined,
  }));
  return {
    calls,
    getBlockNumber: async () => head,
    getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: blockNumber * 12n }),
    getContractEvents: async ({ fromBlock, toBlock, args }: { fromBlock: bigint; toBlock: bigint; args: { voter?: string } }) => {
      if (toBlock - fromBlock + 1n > maxRange) throw new Error("exceed maximum block range");
      calls.push({ from: fromBlock, to: toBlock });
      return all.filter((l) => l.blockNumber >= fromBlock && l.blockNumber <= toBlock && (!args.voter || l.args.voter === args.voter));
    },
  };
}

// The real PublicClient type is huge; the scanner only uses these three methods.
type AnyClient = Parameters<typeof recentVotes>[0];

test("returns the newest votes first and stops once it has enough", async () => {
  const client = fakeClient({ maxRange: 50_000n });
  const votes = await recentVotes(client as unknown as AnyClient, { address, fromBlock: 500n, pollId: 0n, limit: 5 });
  assert.deepEqual(votes.map((v) => v.block), [30_000n, 29_000n, 28_000n, 27_000n, 26_000n]);
  assert.equal(votes[0].time, 360_000);
  assert.equal(client.calls.length, 1, "first 10k-block chunk already had 5 votes");
});

test("halves the chunk when the RPC refuses the range, and stops at fromBlock", async () => {
  const client = fakeClient({ maxRange: 3_000n });
  const votes = await recentVotes(client as unknown as AnyClient, { address, fromBlock: 24_500n, pollId: 0n, limit: 20 });
  assert.deepEqual(votes.map((v) => v.block), [30_000n, 29_000n, 28_000n, 27_000n, 26_000n, 25_000n]);
  assert.ok(client.calls.every((c) => c.to - c.from + 1n <= 3_000n));
  assert.equal(client.calls.at(-1)!.from, 24_500n);
});

test("finds one voter's vote and looks up block times when logs lack them", async () => {
  const client = fakeClient({ maxRange: 50_000n, timestamps: false });
  const [vote] = await recentVotes(client as unknown as AnyClient, { address, fromBlock: 0n, pollId: 0n, voter: voter(3), limit: 1 });
  assert.equal(vote.block, 3_000n);
  assert.equal(vote.time, 36_000);
});

test("returns the newer votes when older history is unavailable", async () => {
  const client = fakeClient({ maxRange: 50_000n });
  const real = client.getContractEvents;
  client.getContractEvents = async (p) => {
    if (p.fromBlock < 25_000n) throw new Error("pruned history unavailable");
    return real(p);
  };
  const votes = await recentVotes(client as unknown as AnyClient, { address, fromBlock: 0n, pollId: 0n, limit: 20 });
  // Every chunk that reaches block 25,000 also starts below it, so the scan stops after 26,000.
  assert.deepEqual(votes.map((v) => v.block), [30_000n, 29_000n, 28_000n, 27_000n, 26_000n]);
});

test("gives up when even the smallest chunk is refused", async () => {
  const client = fakeClient({ maxRange: 10n });
  await assert.rejects(recentVotes(client as unknown as AnyClient, { address, fromBlock: 0n, pollId: 0n, limit: 5 }));
});

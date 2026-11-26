import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { usePublicClient, useReadContracts, useWatchContractEvent } from "wagmi";
import { botohan, deployBlock } from "@/lib/contract";
import { recentVotes, toVote, voteKey, type Vote } from "@/lib/events";

const FALLBACK_REFETCH_MS = 12_000; // some RPCs drop event watchers (TRD.md)

/** Poll + results that update live, plus the newest `feedSize` votes (TRD.md "Reading data"). */
export function usePollLive(pollId: bigint, feedSize: number) {
  const client = usePublicClient({ chainId: botohan.chainId });

  const reads = useReadContracts({
    contracts: [
      { ...botohan, functionName: "getPoll", args: [pollId] },
      { ...botohan, functionName: "getResults", args: [pollId] },
    ],
    query: { refetchInterval: FALLBACK_REFETCH_MS },
  });

  const history = useQuery({
    queryKey: ["votes", botohan.address, pollId.toString(), feedSize],
    queryFn: () => recentVotes(client!, { address: botohan.address, fromBlock: deployBlock, pollId, limit: feedSize }),
    enabled: !!client,
    staleTime: Infinity,
    retry: 1,
  });

  const [live, setLive] = useState<Vote[]>([]);
  useWatchContractEvent({
    ...botohan,
    eventName: "VoteCast",
    args: { pollId },
    pollingInterval: 4_000,
    onLogs(logs) {
      const now = Math.floor(Date.now() / 1000);
      const votes = logs.map((log) => ({ ...toVote(log), time: toVote(log).time ?? now }));
      setLive((prev) => [...votes.reverse(), ...prev].slice(0, feedSize));
      reads.refetch();
    },
  });

  // Merge history and live events: dedupe, newest first.
  const seen = new Set<string>();
  const feed = [...live, ...(history.data ?? [])]
    .filter((v) => (seen.has(voteKey(v)) ? false : (seen.add(voteKey(v)), true)))
    .sort((a, b) => (a.block === b.block ? b.logIndex - a.logIndex : a.block > b.block ? -1 : 1))
    .slice(0, feedSize);

  return {
    reads,
    feed,
    /** Votes that arrived while the page was open; the feed highlights them. */
    liveKeys: new Set(live.map(voteKey)),
    feedError: history.isError,
    feedLoading: history.isPending,
  };
}

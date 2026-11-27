"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { botohan, deployBlock, txUrl } from "@/lib/contract";
import { recentVotes } from "@/lib/events";
import { link } from "@/lib/ui";

type Props = { pollId: bigint; voter: `0x${string}`; options: readonly string[] };

/** "You voted for X", read from your own VoteCast event (the contract doesn't store choices). */
export function YourVote({ pollId, voter, options }: Props) {
  const client = usePublicClient({ chainId: botohan.chainId });
  const vote = useQuery({
    queryKey: ["yourVote", botohan.address, pollId.toString(), voter],
    queryFn: async () => {
      const [mine] = await recentVotes(client!, { address: botohan.address, fromBlock: deployBlock, pollId, voter, limit: 1 });
      return mine ?? null;
    },
    enabled: !!client,
    staleTime: Infinity,
  });

  const mine = vote.data;
  return (
    <p className="border-t-[3px] border-ink pt-4">
      {/* If the RPC refuses the log query, still say they voted, just not for what. */}
      {mine ? (
        <>
          You voted for <strong>{options[Number(mine.option)]}</strong>.{" "}
          <a href={txUrl(mine.hash)} target="_blank" rel="noopener noreferrer" className={link}>
            View on Etherscan
          </a>
        </>
      ) : (
        "You already voted in this poll."
      )}
    </p>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { botohan, deployBlock, txUrl } from "@/lib/contract";
import { link } from "@/lib/ui";

type Props = { pollId: bigint; voter: `0x${string}`; options: readonly string[] };

/** "You voted for X", read from your own VoteCast event (the contract doesn't store choices). */
export function YourVote({ pollId, voter, options }: Props) {
  const client = usePublicClient({ chainId: botohan.chainId });
  const vote = useQuery({
    queryKey: ["yourVote", botohan.address, pollId.toString(), voter],
    queryFn: async () => {
      const logs = await client!.getContractEvents({
        abi: botohan.abi,
        address: botohan.address,
        eventName: "VoteCast",
        args: { pollId, voter },
        fromBlock: deployBlock,
      });
      return logs[0] ?? null;
    },
    enabled: !!client,
    staleTime: Infinity,
  });

  const event = vote.data;
  const option = event?.args.option;
  return (
    <p className="border-t-[3px] border-ink pt-4">
      {/* If the RPC refuses the log query, still say they voted, just not for what. */}
      {event && option !== undefined ? (
        <>
          You voted for <strong>{options[Number(option)]}</strong>.{" "}
          <a href={txUrl(event.transactionHash)} target="_blank" rel="noopener noreferrer" className={link}>
            View on Etherscan
          </a>
        </>
      ) : (
        "You already voted in this poll."
      )}
    </p>
  );
}

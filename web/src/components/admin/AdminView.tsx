"use client";

import { useConnection, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { AddVoters } from "@/components/admin/AddVoters";
import { ClosePoll } from "@/components/admin/ClosePoll";
import { CreatePoll } from "@/components/admin/CreatePoll";
import { botohan } from "@/lib/contract";
import { usePolls } from "@/lib/usePolls";

/** Owner-only page (APP_FLOW.md Flow 4). The contract enforces onlyOwner; this check is just UX. */
export function AdminView() {
  const { address, chainId, status } = useConnection();
  const owner = useReadContract({ ...botohan, functionName: "owner" });
  const polls = usePolls();

  let gate: string | null = null;
  if (status !== "connected") gate = "Connect the owner wallet to use this page.";
  else if (chainId !== sepolia.id) gate = "Switch to Sepolia to use this page.";
  else if (owner.isPending) gate = "Checking the owner…";
  else if (owner.isError) gate = "Couldn't read the contract owner. Check your connection and refresh.";
  else if (owner.data.toLowerCase() !== address?.toLowerCase()) gate = "Only the poll owner can use this page.";

  return (
    <div className="space-y-10">
      <h1 className="font-display text-[28px] leading-tight">Admin</h1>
      {gate ? (
        <p className="border-t-[3px] border-ink pt-4">{gate}</p>
      ) : (
        <>
          <CreatePoll onCreated={polls.refetch} />
          <AddVoters polls={polls.rows} />
          <ClosePoll polls={polls.rows} onClosed={polls.refetch} />
        </>
      )}
    </div>
  );
}

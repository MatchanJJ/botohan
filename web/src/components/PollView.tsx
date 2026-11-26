"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useConnection, useReadContracts } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ResultsBars } from "@/components/ResultsBars";
import { VoteForm } from "@/components/VoteForm";
import { YourVote } from "@/components/YourVote";
import { botohan, pollStatus } from "@/lib/contract";
import { formatDuration, plural } from "@/lib/format";
import { useNow } from "@/lib/useNow";

export function PollView() {
  const { id: rawId } = useParams<{ id: string }>();
  if (!/^\d{1,30}$/.test(rawId)) return <p className="text-bad">This poll doesn&apos;t exist.</p>;
  return <Poll id={BigInt(rawId)} />;
}

function Poll({ id }: { id: bigint }) {
  const now = useNow();
  const { address, chainId, status: walletStatus } = useConnection();
  const [votedHere, setVotedHere] = useState(false);

  const poll = useReadContracts({
    contracts: [
      { ...botohan, functionName: "getPoll", args: [id] },
      { ...botohan, functionName: "getResults", args: [id] },
    ],
  });
  // Pre-checks, so most errors show before the user signs anything (APP_FLOW.md).
  const wallet = useReadContracts({
    contracts: [
      { ...botohan, functionName: "hasVoted", args: [id, address!] },
      { ...botohan, functionName: "isAllowed", args: [id, address!] },
    ],
    query: { enabled: !!address },
  });

  if (poll.isPending || now === 0) return <p className="text-grey">Loading poll…</p>;
  const [pollRead, resultsRead] = poll.data ?? [];
  if (poll.isError || pollRead?.status !== "success" || resultsRead?.status !== "success") {
    return <p className="text-bad">Couldn&apos;t load this poll. It may not exist.</p>;
  }

  const p = pollRead.result;
  const status = pollStatus(p, now);
  const t = BigInt(now);

  function onVoted() {
    setVotedHere(true);
    poll.refetch();
    wallet.refetch();
  }

  let voteArea: React.ReactNode = null;
  if (status === "open") {
    const [hasVoted, isAllowed] = wallet.data?.map((r) => r.result) ?? [];
    if (walletStatus !== "connected") voteArea = <Note>Connect your wallet to vote.</Note>;
    else if (chainId !== sepolia.id) voteArea = <Note>Switch to Sepolia to vote.</Note>;
    else if (wallet.isPending) voteArea = <Note>Checking your wallet…</Note>;
    else if (hasVoted && !votedHere) voteArea = <YourVote pollId={id} voter={address!} options={p.options} />;
    else if (p.restricted && !isAllowed && !votedHere) {
      voteArea = <Note>This poll is only for wallets registered for the workshop.</Note>;
    } else voteArea = <VoteForm pollId={id} options={p.options} onVoted={onVoted} />;
  }

  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-display text-[28px] leading-tight sm:text-[44px]">{p.title}</h1>
        <p className="mt-2 text-grey">
          {status === "open" && `Open · closes in ${formatDuration(p.endsAt - t)}`}
          {status === "upcoming" && `Opens in ${formatDuration(p.startsAt - t)}`}
          {status === "closed" && "Closed"}
          {" · "}
          {plural(p.totalVotes, "vote")}
          {p.restricted && " · registered wallets only"}
        </p>
      </header>
      {voteArea}
      <ResultsBars options={p.options} results={resultsRead.result} />
    </article>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="border-t-[3px] border-ink pt-4">{children}</p>;
}

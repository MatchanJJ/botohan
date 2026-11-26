"use client";

import { useEffect, useRef, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { botohan, txUrl } from "@/lib/contract";
import { messages, voteErrorMessage } from "@/lib/errors";
import { link, primaryButton } from "@/lib/ui";

type Props = { pollId: bigint; options: readonly string[]; onVoted: () => void };

/** Vote button state machine from APP_FLOW.md: idle → wallet → pending → confirmed / error. */
export function VoteForm({ pollId, options, onVoted }: Props) {
  const [choice, setChoice] = useState<number | null>(null);
  const write = useWriteContract();
  const hash = write.data;
  const receipt = useWaitForTransactionReceipt({ hash, chainId: botohan.chainId });

  const confirmed = receipt.data?.status === "success";
  const reverted = receipt.data?.status === "reverted";
  const recording = !!hash && !receipt.data && !receipt.error;
  const busy = write.isPending || recording;

  // Report each confirmed vote once; onVoted is a new function on every parent render.
  const reported = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (confirmed && reported.current !== hash) {
      reported.current = hash;
      onVoted();
    }
  }, [confirmed, hash, onVoted]);

  const error = write.error
    ? voteErrorMessage(write.error)
    : reverted || receipt.error
      ? messages.generic
      : null;

  const label = write.isPending
    ? "Confirm in MetaMask…"
    : recording
      ? "Recording your vote…"
      : confirmed
        ? "Voted"
        : "Vote";

  return (
    <form
      className="border-t-[3px] border-ink pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (choice === null) return;
        write.mutate({ ...botohan, functionName: "vote", args: [pollId, BigInt(choice)] });
      }}
    >
      <fieldset disabled={busy || confirmed} className="space-y-2">
        <legend className="mb-2 font-semibold">Pick one option</legend>
        {options.map((label, i) => (
          <label
            key={i}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[6px] border-2 px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-eth ${
              choice === i ? "border-eth" : "border-soft"
            }`}
          >
            <input
              type="radio"
              name="option"
              value={i}
              checked={choice === i}
              onChange={() => setChoice(i)}
              className="size-5 accent-eth"
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 text-bad">
          {error}
          {hash && (
            <>
              {" "}
              <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer" className={link}>
                View on Etherscan
              </a>
            </>
          )}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" className={primaryButton} disabled={choice === null || busy || confirmed}>
          {label}
        </button>
        {recording && hash && (
          <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer" className={link}>
            View on Etherscan
          </a>
        )}
      </div>

      {confirmed && hash && (
        <p role="status" className="mt-4 font-semibold text-ok">
          Your vote is on the blockchain.{" "}
          <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer" className={link}>
            View transaction
          </a>
        </p>
      )}
    </form>
  );
}

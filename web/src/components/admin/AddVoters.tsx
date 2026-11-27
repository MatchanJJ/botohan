"use client";

import { useState } from "react";
import { parseEventLogs } from "viem";
import { usePublicClient, useWriteContract } from "wagmi";
import { TxStatus } from "@/components/admin/TxStatus";
import { chunk, LIMITS, parseVoters } from "@/lib/admin";
import { botohan, pollStatus } from "@/lib/contract";
import { plural } from "@/lib/format";
import { input, label, primaryButton } from "@/lib/ui";
import type { TxPhase } from "@/lib/useContractTx";
import { useNow } from "@/lib/useNow";
import type { PollRow } from "@/lib/usePolls";

type Progress = { phase: TxPhase; batch: number; total: number; hash?: `0x${string}`; error?: unknown; added?: bigint };

/** Paste addresses (one per line, or a CSV column), validate, dedupe, send in batches of 200. */
export function AddVoters({ polls }: { polls: PollRow[] }) {
  const now = useNow();
  const client = usePublicClient({ chainId: botohan.chainId });
  const write = useWriteContract();
  const [pollId, setPollId] = useState("");
  const [text, setText] = useState("");
  const [progress, setProgress] = useState<Progress>({ phase: "idle", batch: 0, total: 0 });

  const restricted = polls.filter((r) => r.poll.restricted && pollStatus(r.poll, now) !== "closed");
  const list = parseVoters(text);
  const batches = chunk(list.valid, LIMITS.votersPerCall);
  const busy = progress.phase === "wallet" || progress.phase === "pending";

  async function send() {
    if (!client || pollId === "" || batches.length === 0) return;
    let added = 0n;
    for (const [i, batch] of batches.entries()) {
      const step = { batch: i + 1, total: batches.length };
      try {
        setProgress({ ...step, phase: "wallet" });
        const hash = await write.mutateAsync({ ...botohan, functionName: "addVoters", args: [BigInt(pollId), batch] });
        setProgress({ ...step, phase: "pending", hash });
        const receipt = await client.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error("reverted");
        const [event] = parseEventLogs({ abi: botohan.abi, logs: receipt.logs, eventName: "VotersAdded" });
        added += event?.args.count ?? 0n;
      } catch (error) {
        setProgress((p) => ({ ...p, ...step, phase: "error", error }));
        return;
      }
    }
    setProgress({ phase: "done", batch: batches.length, total: batches.length, added });
  }

  return (
    <section className="border-t-[3px] border-ink pt-4">
      <h2 className="font-display text-[20px]">Add voters</h2>
      {restricted.length === 0 ? (
        <p className="mt-2 text-grey">No open or upcoming restricted polls. Create one above first.</p>
      ) : (
        <form
          className="mt-4 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <fieldset disabled={busy} className="space-y-5">
            <div>
              <label htmlFor="voters-poll" className={label}>
                Restricted poll
              </label>
              <select id="voters-poll" className={input} value={pollId} onChange={(e) => setPollId(e.target.value)}>
                <option value="">Pick a poll</option>
                {restricted.map(({ id, poll }) => (
                  <option key={id.toString()} value={id.toString()}>
                    #{id.toString()} {poll.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="voters-list" className={label}>
                Wallet addresses
              </label>
              <textarea
                id="voters-list"
                rows={8}
                className={`${input} h-auto py-2 font-mono text-[14px]`}
                placeholder={"0x1c41…\n0x77a0…"}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (!busy) setProgress({ phase: "idle", batch: 0, total: 0 });
                }}
                aria-describedby="voters-hint voters-count"
              />
              <p id="voters-hint" className="mt-1 text-[14px] text-grey">
                One per line, or paste a column from the registration sheet.
              </p>
            </div>
          </fieldset>

          {text.trim() && (
            <div id="voters-count" aria-live="polite">
              <p>
                <span className="font-semibold">{plural(list.valid.length, "valid address")}</span>
                {list.invalid.length > 0 && <span className="text-bad"> · {list.invalid.length} invalid</span>}
                {list.duplicates > 0 && ` · ${plural(list.duplicates, "duplicate")} removed`}
                {batches.length > 1 && ` · ${batches.length} transactions of up to ${LIMITS.votersPerCall}`}
              </p>
              {list.invalid.length > 0 && (
                <p className="mt-1 break-all font-mono text-[14px] text-bad">
                  Skipped: {list.invalid.slice(0, 5).join(", ")}
                  {list.invalid.length > 5 && ` and ${list.invalid.length - 5} more`}
                </p>
              )}
            </div>
          )}

          <TxStatus
            phase={progress.phase}
            hash={progress.hash}
            error={progress.error}
            label={progress.total > 1 ? `Batch ${progress.batch} of ${progress.total}: ` : ""}
          />
          {progress.phase === "done" && (
            <p role="status" className="font-semibold text-ok">
              Done. {plural(progress.added ?? 0n, "new wallet")} can now vote
              {progress.total > 1 && ` (${progress.total} transactions)`}. Already-added wallets are skipped.
            </p>
          )}

          <button type="submit" className={primaryButton} disabled={busy || pollId === "" || list.valid.length === 0}>
            Add voters
          </button>
        </form>
      )}
    </section>
  );
}

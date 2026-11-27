"use client";

import { useEffect, useRef, useState } from "react";
import { TxStatus } from "@/components/admin/TxStatus";
import { botohan, pollStatus } from "@/lib/contract";
import { input, label, primaryButton } from "@/lib/ui";
import { useContractTx } from "@/lib/useContractTx";
import { useNow } from "@/lib/useNow";
import type { PollRow } from "@/lib/usePolls";

/** Pick an open (or upcoming) poll → confirm → closePoll. */
export function ClosePoll({ polls, onClosed }: { polls: PollRow[]; onClosed: () => void }) {
  const now = useNow();
  const [pollId, setPollId] = useState("");
  const tx = useContractTx();

  const closable = polls.filter((r) => pollStatus(r.poll, now) !== "closed");
  const selected = polls.find((r) => r.id.toString() === pollId);
  const busy = tx.phase === "wallet" || tx.phase === "pending";

  const reported = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (tx.phase === "done" && reported.current !== tx.hash) {
      reported.current = tx.hash;
      onClosed();
    }
  }, [tx.phase, tx.hash, onClosed]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const ok = window.confirm(
      `Close "${selected.poll.title}" now?\n\nNobody can vote after this. Votes already cast stay, and this can't be undone.`,
    );
    if (ok) tx.write.mutate({ ...botohan, functionName: "closePoll", args: [selected.id] });
  }

  return (
    <section className="border-t-[3px] border-ink pt-4">
      <h2 className="font-display text-[20px]">Close poll</h2>
      {tx.phase === "done" ? (
        <p role="status" className="mt-2 font-semibold text-ok">
          Poll closed. The results are final.
        </p>
      ) : closable.length === 0 ? (
        <p className="mt-2 text-grey">No open or upcoming polls.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-5">
          <div>
            <label htmlFor="close-poll" className={label}>
              Poll
            </label>
            <select
              id="close-poll"
              className={input}
              value={pollId}
              disabled={busy}
              onChange={(e) => setPollId(e.target.value)}
            >
              <option value="">Pick a poll</option>
              {closable.map(({ id, poll }) => (
                <option key={id.toString()} value={id.toString()}>
                  #{id.toString()} {poll.title}
                </option>
              ))}
            </select>
          </div>
          <TxStatus phase={tx.phase} hash={tx.hash} error={tx.write.error ?? tx.receipt.error} />
          <button type="submit" className={primaryButton} disabled={busy || !selected}>
            Close poll
          </button>
        </form>
      )}
    </section>
  );
}

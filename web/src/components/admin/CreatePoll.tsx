"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { parseEventLogs } from "viem";
import { TxStatus } from "@/components/admin/TxStatus";
import { LIMITS, validatePoll } from "@/lib/admin";
import { botohan } from "@/lib/contract";
import { input, label, link, primaryButton, secondaryButton } from "@/lib/ui";
import { useContractTx } from "@/lib/useContractTx";

const DURATIONS = [
  { value: "600", text: "10 min" },
  { value: "3600", text: "1 hour" },
  { value: "86400", text: "1 day" },
  { value: "custom", text: "Custom" },
];

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function CreatePoll({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [start, setStart] = useState(""); // datetime-local; empty = now
  const [duration, setDuration] = useState("600");
  const [customMinutes, setCustomMinutes] = useState("30");
  const [restricted, setRestricted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const tx = useContractTx();

  const created = tx.receipt.data?.status === "success"
    ? parseEventLogs({ abi: botohan.abi, logs: tx.receipt.data.logs, eventName: "PollCreated" })[0]?.args.pollId
    : undefined;

  // Refresh the poll lists once per created poll.
  const reported = useRef<bigint | undefined>(undefined);
  useEffect(() => {
    if (created !== undefined && reported.current !== created) {
      reported.current = created;
      onCreated();
    }
  }, [created, onCreated]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const now = nowSeconds();
    const startsAt = start ? Math.floor(new Date(start).getTime() / 1000) : now;
    const seconds = duration === "custom" ? Math.round(Number(customMinutes) * 60) : Number(duration);
    const draft = { title, options, startsAt, endsAt: startsAt + seconds };
    const problems = validatePoll(draft, now);
    if (duration === "custom" && !(seconds > 0)) problems.push("Enter a custom duration in minutes.");
    setErrors(problems);
    if (problems.length > 0) return;

    tx.write.mutate({
      ...botohan,
      functionName: "createPoll",
      args: [title.trim(), options.map((o) => o.trim()), BigInt(startsAt), BigInt(draft.endsAt), restricted],
    });
  }

  function reset() {
    setTitle("");
    setOptions(["", ""]);
    setStart("");
    setErrors([]);
    tx.write.reset();
  }

  const busy = tx.phase === "wallet" || tx.phase === "pending";

  if (created !== undefined) {
    return (
      <section className="border-t-[3px] border-ink pt-4">
        <h2 className="font-display text-[20px]">Create poll</h2>
        <p role="status" className="mt-2 font-semibold text-ok">
          Poll #{created.toString()} is on the blockchain.
        </p>
        <p className="mt-2 flex flex-wrap gap-4">
          <Link href={`/poll/${created}`} className={link}>
            Open the poll
          </Link>
          <Link href={`/poll/${created}/present`} className={link}>
            Present mode
          </Link>
        </p>
        {restricted && <p className="mt-2">This poll is restricted: add voter addresses below.</p>}
        <button type="button" className={`${secondaryButton} mt-4`} onClick={reset}>
          Create another poll
        </button>
      </section>
    );
  }

  return (
    <section className="border-t-[3px] border-ink pt-4">
      <h2 className="font-display text-[20px]">Create poll</h2>
      <form onSubmit={submit} className="mt-4 space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <div>
            <label htmlFor="title" className={label}>
              Title
            </label>
            <input id="title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <fieldset>
            <legend className={label}>
              Options ({LIMITS.minOptions} to {LIMITS.maxOptions})
            </legend>
            <ol className="space-y-2">
              {options.map((value, i) => (
                <li key={i} className="flex gap-2">
                  <input
                    aria-label={`Option ${i + 1}`}
                    className={input}
                    value={value}
                    onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
                  />
                  {options.length > LIMITS.minOptions && (
                    <button
                      type="button"
                      className={secondaryButton}
                      aria-label={`Remove option ${i + 1}`}
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {options.length < LIMITS.maxOptions && (
              <button type="button" className={`${secondaryButton} mt-2`} onClick={() => setOptions([...options, ""])}>
                Add option
              </button>
            )}
          </fieldset>

          <div>
            <label htmlFor="start" className={label}>
              Start
            </label>
            <input
              id="start"
              type="datetime-local"
              className={`${input} sm:w-auto`}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-describedby="start-hint"
            />
            <p id="start-hint" className="mt-1 text-[14px] text-grey">
              Leave empty to start now.
            </p>
          </div>

          <fieldset>
            <legend className={label}>Duration</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {DURATIONS.map((d) => (
                <label key={d.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="duration"
                    value={d.value}
                    checked={duration === d.value}
                    onChange={() => setDuration(d.value)}
                    className="size-5 accent-eth"
                  />
                  {d.text}
                </label>
              ))}
            </div>
            {duration === "custom" && (
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  className={`${input} w-28`}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                />
                minutes
              </label>
            )}
          </fieldset>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={restricted}
              onChange={(e) => setRestricted(e.target.checked)}
              className="size-5 accent-eth"
            />
            Restricted: only wallets I add can vote
          </label>
        </fieldset>

        {errors.length > 0 && (
          <ul role="alert" className="list-disc pl-5 text-bad">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <TxStatus phase={tx.phase} hash={tx.hash} error={tx.write.error ?? tx.receipt.error} />

        <button type="submit" className={primaryButton} disabled={busy}>
          Create poll
        </button>
      </form>
    </section>
  );
}

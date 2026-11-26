"use client";

import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { botohan, pollStatus, type PollStatus } from "@/lib/contract";
import { formatDuration, plural } from "@/lib/format";
import { link } from "@/lib/ui";
import { useNow } from "@/lib/useNow";

const groups: { status: PollStatus; heading: string }[] = [
  { status: "open", heading: "Open" },
  { status: "upcoming", heading: "Upcoming" },
  { status: "closed", heading: "Closed" },
];

export function PollList() {
  const now = useNow();
  const count = useReadContract({ ...botohan, functionName: "pollCount" });
  const n = Number(count.data ?? 0n);
  // Newest first: ids n-1 … 0.
  const ids = Array.from({ length: n }, (_, i) => BigInt(n - 1 - i));
  const polls = useReadContracts({
    contracts: ids.map((id) => ({ ...botohan, functionName: "getPoll", args: [id] }) as const),
    query: { enabled: n > 0 },
  });

  if (count.isError || polls.isError) {
    return <p className="text-bad">Couldn&apos;t load polls. Check your connection and refresh.</p>;
  }
  if (count.isPending || (n > 0 && polls.isPending) || now === 0) {
    return <p className="text-grey">Loading polls…</p>;
  }
  if (n === 0) return <p className="text-grey">No polls yet.</p>;

  const rows = (polls.data ?? []).flatMap((r, i) =>
    r.status === "success" ? [{ id: ids[i], poll: r.result, status: pollStatus(r.result, now) }] : [],
  );

  return (
    <div className="space-y-8">
      {groups.map(({ status, heading }) => {
        const inGroup = rows.filter((r) => r.status === status);
        if (inGroup.length === 0) return null;
        return (
          <section key={status} className="border-t-[3px] border-ink pt-4">
            <h2 className="font-display text-[20px]">{heading}</h2>
            <ul className="mt-2 divide-y divide-soft">
              {inGroup.map(({ id, poll }) => (
                <li key={id.toString()} className="py-3">
                  <Link href={`/poll/${id}`} className={`${link} text-[20px]`}>
                    {poll.title}
                  </Link>
                  <p className="text-grey">
                    {plural(poll.totalVotes, "vote")}
                    {status === "open" && ` · closes in ${formatDuration(poll.endsAt - BigInt(now))}`}
                    {status === "upcoming" && ` · opens in ${formatDuration(poll.startsAt - BigInt(now))}`}
                    {poll.restricted && " · registered wallets only"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

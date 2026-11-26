"use client";

import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import { ResultsBars } from "@/components/ResultsBars";
import { VoteFeed } from "@/components/VoteFeed";
import { pollStatus } from "@/lib/contract";
import { formatClock, plural } from "@/lib/format";
import { useNow } from "@/lib/useNow";
import { usePollLive } from "@/lib/usePollLive";

export function PresentView() {
  const { id: rawId } = useParams<{ id: string }>();
  if (!/^\d{1,30}$/.test(rawId)) return <p className="p-8 text-bad">This poll doesn&apos;t exist.</p>;
  return <Present id={BigInt(rawId)} />;
}

function Present({ id }: { id: bigint }) {
  const now = useNow();
  const { reads, ...feed } = usePollLive(id, 8);

  // Press F to toggle full screen (APP_FLOW.md Flow 3).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "f" && e.key !== "F") return;
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (reads.isPending || now === 0) return <p className="p-8 text-grey">Loading poll…</p>;
  const [pollRead, resultsRead] = reads.data ?? [];
  if (reads.isError || pollRead?.status !== "success" || resultsRead?.status !== "success") {
    return <p className="p-8 text-bad">Couldn&apos;t load this poll. It may not exist.</p>;
  }

  const p = pollRead.result;
  const status = pollStatus(p, now);
  const t = BigInt(now);
  const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const voteUrl = `${site.replace(/\/$/, "")}/poll/${id}`;

  return (
    <main className="flex min-h-screen flex-col gap-10 border-t-[3px] border-ink px-8 py-8 lg:px-16">
      <header className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <h1 className="font-display text-[44px] leading-tight lg:text-[72px] xl:text-[96px]">{p.title}</h1>
          <p className="mt-4 text-[28px] text-grey">
            {status === "open" && `Open · closes in ${formatClock(p.endsAt - t)}`}
            {status === "upcoming" && `Opens in ${formatClock(p.startsAt - t)}`}
            {status === "closed" && "Closed"}
            {" · "}
            {plural(p.totalVotes, "vote")}
          </p>
        </div>
        <figure className="shrink-0 text-center">
          <QRCodeSVG value={voteUrl} size={220} marginSize={2} title={`Scan to vote: ${voteUrl}`} />
          <figcaption className="mt-2 font-mono text-[20px]">{voteUrl.replace(/^https?:\/\//, "")}</figcaption>
        </figure>
      </header>

      <ResultsBars options={p.options} results={resultsRead.result} large />
      <VoteFeed {...feed} now={now} large />
      <p className="mt-auto text-[14px] text-grey">Press F for full screen</p>
    </main>
  );
}

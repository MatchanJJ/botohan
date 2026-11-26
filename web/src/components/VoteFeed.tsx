import { txUrl } from "@/lib/contract";
import { voteKey, type Vote } from "@/lib/events";
import { formatAgo, shortAddress } from "@/lib/format";
import { link } from "@/lib/ui";

type Props = {
  feed: Vote[];
  liveKeys: Set<string>;
  feedError: boolean;
  feedLoading: boolean;
  now: number;
  large?: boolean;
};

/** "0x1c4…9A3C voted · 12s ago · tx 0x8f2e…"; rows that arrive live briefly highlight. */
export function VoteFeed({ feed, liveKeys, feedError, feedLoading, now, large = false }: Props) {
  return (
    <section aria-label="Recent votes" className="border-t-[3px] border-ink pt-4">
      {!large && <h2 className="font-display text-[20px]">Recent votes</h2>}
      {feedError && (
        <p className="text-grey">Couldn&apos;t load earlier votes. New votes still show up here.</p>
      )}
      {feed.length === 0 ? (
        <p className="mt-2 text-grey">{feedLoading ? "Loading votes…" : "No votes yet."}</p>
      ) : (
        <ul aria-live="polite" className={`mt-2 font-mono ${large ? "text-[20px]" : "text-[14px] sm:text-[16px]"}`}>
          {feed.map((v) => (
            <li key={voteKey(v)} className={`py-1 ${liveKeys.has(voteKey(v)) ? "flash" : ""}`}>
              {shortAddress(v.voter)} voted
              {v.time !== undefined && ` · ${formatAgo(now - v.time)}`} ·{" "}
              <a href={txUrl(v.hash)} target="_blank" rel="noopener noreferrer" className={link}>
                tx {v.hash.slice(0, 6)}…
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

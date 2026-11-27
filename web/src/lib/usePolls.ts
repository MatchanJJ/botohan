import { useReadContract, useReadContracts } from "wagmi";
import { botohan } from "@/lib/contract";

/** Every poll, newest first, via one multicall (TRD.md "Reading data"). */
export function usePolls() {
  const count = useReadContract({ ...botohan, functionName: "pollCount" });
  const n = Number(count.data ?? 0n);
  const ids = Array.from({ length: n }, (_, i) => BigInt(n - 1 - i));
  const polls = useReadContracts({
    contracts: ids.map((id) => ({ ...botohan, functionName: "getPoll", args: [id] }) as const),
    query: { enabled: n > 0 },
  });

  const rows = (polls.data ?? []).flatMap((r, i) => (r.status === "success" ? [{ id: ids[i], poll: r.result }] : []));
  return {
    rows,
    isError: count.isError || polls.isError,
    isPending: count.isPending || (n > 0 && polls.isPending),
    refetch: () => Promise.all([count.refetch(), polls.refetch()]),
  };
}

export type PollRow = ReturnType<typeof usePolls>["rows"][number];

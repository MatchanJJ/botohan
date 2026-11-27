import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { botohan } from "@/lib/contract";

export type TxPhase = "idle" | "wallet" | "pending" | "done" | "error";

/** One contract write and its receipt, reduced to a single phase for the UI. */
export function useContractTx() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: botohan.chainId });

  let phase: TxPhase = "idle";
  if (write.isPending) phase = "wallet";
  else if (write.data && !receipt.data && !receipt.error) phase = "pending";
  else if (receipt.data?.status === "success") phase = "done";
  else if (write.error || receipt.error || receipt.data) phase = "error";

  return { write, receipt, phase, hash: write.data };
}

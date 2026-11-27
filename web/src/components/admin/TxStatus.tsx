import { txUrl } from "@/lib/contract";
import { adminRejected, adminReverts, messages, txErrorMessage } from "@/lib/errors";
import type { TxPhase } from "@/lib/useContractTx";
import { link } from "@/lib/ui";

type Props = { phase: TxPhase; hash?: `0x${string}`; error?: unknown; label?: string };

/** "Confirm in MetaMask…" → "Waiting for confirmation…" → error message. Success is shown by the caller. */
export function TxStatus({ phase, hash, error, label = "" }: Props) {
  const etherscan = hash && (
    <>
      {" "}
      <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer" className={link}>
        View on Etherscan
      </a>
    </>
  );

  if (phase === "wallet") return <p role="status">{label}Confirm in MetaMask…</p>;
  if (phase === "pending") {
    return (
      <p role="status">
        {label}Waiting for confirmation…{etherscan}
      </p>
    );
  }
  if (phase === "error") {
    return (
      <p role="alert" className="text-bad">
        {label}
        {error ? txErrorMessage(error, adminReverts, adminRejected) : messages.generic}
        {etherscan}
      </p>
    );
  }
  return null;
}

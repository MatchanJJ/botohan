"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useConnect, useConnection, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { shortAddress } from "@/lib/format";
import { link, primaryButton as primary, secondaryButton as secondary } from "@/lib/ui";

// The server can't see the extension, so it assumes one is there; the client corrects it after hydration.
function useHasInjectedWallet() {
  return useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "ethereum" in window,
    () => true,
  );
}

export function Header() {
  return (
    <header className="border-t-[3px] border-ink">
      <div className="mx-auto flex max-w-[880px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="font-display text-[20px] text-eth hover:underline focus-visible:outline-2 focus-visible:outline-eth"
        >
          Botohan
        </Link>
        <span className="rounded-[4px] border border-soft px-2 py-0.5 text-[14px] text-grey">
          Sepolia testnet
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <WalletControls />
        </div>
      </div>
    </header>
  );
}

function WalletControls() {
  const hasWallet = useHasInjectedWallet();
  const { address, chainId, status } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (status === "connected") {
    const disconnectButton = (
      <button type="button" className={secondary} onClick={() => disconnect.mutate()}>
        Disconnect
      </button>
    );

    if (chainId !== sepolia.id) {
      return (
        <>
          {switchChain.error && <p className="text-[14px] text-bad">Couldn&apos;t switch network. Try again.</p>}
          <button
            type="button"
            className={primary}
            disabled={switchChain.isPending}
            onClick={() => switchChain.mutate({ chainId: sepolia.id })}
          >
            {switchChain.isPending ? "Confirm in MetaMask…" : "Switch to Sepolia"}
          </button>
          {disconnectButton}
        </>
      );
    }

    return (
      <>
        <span className="font-mono text-[16px]" title={address}>
          {shortAddress(address)}
        </span>
        {disconnectButton}
      </>
    );
  }

  if (!hasWallet) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        Install MetaMask to vote
      </a>
    );
  }

  const busy = status === "connecting" || status === "reconnecting" || connect.isPending;
  return (
    <>
      {connect.error && <p className="text-[14px] text-bad">Couldn&apos;t connect. Try again.</p>}
      <button
        type="button"
        className={primary}
        disabled={busy}
        onClick={() => connect.mutate({ connector: connectors[0] })}
      >
        {busy ? "Connecting…" : "Connect wallet"}
      </button>
    </>
  );
}

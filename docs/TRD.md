# TRD: Botohan

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Smart contract | Solidity ^0.8.24, OpenZeppelin Contracts 5.x (`Ownable`) | One contract: `Botohan` |
| Contract tooling | Foundry (forge, cast) ≥ 1.8 | Tests, scripts, deploy, verify |
| Network | Ethereum Sepolia (chain id 11155111) | Same testnet as the workshop activity |
| Frontend | Next.js 16 (App Router), TypeScript, React 19 | Client components for wallet code |
| Web3 | wagmi 3.x, viem 2.x, @tanstack/react-query 5.x | `injected()` connector only (MetaMask) |
| Typed ABI | @wagmi/cli with the `foundry` plugin | Generates `src/generated.ts` from `contracts/out` |
| Styling | Tailwind CSS (or CSS modules), fonts via `next/font/google` | See DESIGN_BRIEF.md |
| QR code | `qrcode.react` (or similar small lib) | Present mode |
| Package manager | pnpm | |
| Hosting | **Vercel** | Zero-config Next.js, preview URL per PR |
| CI | GitHub Actions | Contracts + web workflows |

**Why Vercel over Cloudflare Pages:** Next.js runs on Vercel with no adapter, and every PR gets a
preview URL to test on a phone before the workshop. The app has no backend, so moving to Cloudflare
Pages later (static export) is still possible.

**Why only the `injected` connector:** every student already has the MetaMask extension (or the
MetaMask mobile in-app browser), which injects a provider. This avoids WalletConnect project IDs
and extra connector packages (wagmi 3 makes connector SDKs optional peer deps).

## Repository layout

```
botohan/
├─ CLAUDE.md
├─ docs/                      # these planning docs
├─ contracts/                 # Foundry project
│  ├─ src/Botohan.sol
│  ├─ test/Botohan.t.sol
│  ├─ script/Deploy.s.sol
│  ├─ script/SeedPoll.s.sol   # creates the first demo poll
│  ├─ deployments/sepolia.json  # { "Botohan": "0x…", "deployBlock": 1234567 }
│  └─ foundry.toml
├─ web/                       # Next.js app
│  ├─ wagmi.config.ts         # @wagmi/cli config (foundry plugin)
│  ├─ src/generated.ts        # generated ABI + address (committed)
│  ├─ src/app/...             # routes (see APP_FLOW.md)
│  ├─ src/lib/wagmi.ts        # createConfig
│  └─ src/components/...
└─ .github/workflows/
   ├─ contracts.yml
   └─ web.yml
```

## wagmi setup

```ts
// web/src/lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
  ssr: true,
})
```

- Wrap the app in `WagmiProvider` + `QueryClientProvider` in a client `providers.tsx`.
- wagmi 3 names: `useConnection` (not `useAccount`), `useConnectors`, `useSwitchChain`,
  `useReadContract(s)`, `useWriteContract` (`mutate`/`mutateAsync`),
  `useWaitForTransactionReceipt`, `useWatchContractEvent`, `usePublicClient`.

## Reading data

- Poll data and results: `useReadContracts` (multicall) for `pollCount`, `getPoll`, `getResults`,
  `hasVoted`.
- Live updates: `useWatchContractEvent` on `VoteCast` and `PollCreated`, then invalidate the
  read queries. Also refetch results every 12 s as a fallback (some RPCs drop event watchers).
- Recent-votes feed: on load, `publicClient.getContractEvents` for `VoteCast` from
  `NEXT_PUBLIC_DEPLOY_BLOCK` for the poll id; then append new events from the watcher.
  Show the newest 20.

## Environment variables (web)

| Name | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/<key>` | Public in the browser: restrict the key to the Vercel domain in the provider dashboard |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0x…` | From `contracts/deployments/sepolia.json` |
| `NEXT_PUBLIC_DEPLOY_BLOCK` | `1234567` | Start block for event queries |
| `NEXT_PUBLIC_SITE_URL` | `https://botohan.vercel.app` | Used for the QR code |

A free public Sepolia RPC works for development, but use a provider key (Alchemy or Infura) for the
workshop: 30+ students polling at once can hit public rate limits.

## Environment (contracts)

- `ETHERSCAN_API_KEY` in the shell (not committed) for `--verify`.
- Deployer: Foundry keystore account named `deployer`. Mark creates it himself.
- `foundry.toml` has `[rpc_endpoints] sepolia = "${SEPOLIA_RPC_URL}"` and
  `[etherscan] sepolia = { key = "${ETHERSCAN_API_KEY}" }`.

Deploy (Mark runs it):

```bash
forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify
```

## CI (GitHub Actions)

**contracts.yml** (on PRs touching `contracts/**`): checkout with submodules, `foundry-rs/foundry-toolchain`,
`forge fmt --check`, `forge build --sizes`, `forge test -vvv`.

**web.yml** (on PRs touching `web/**`): pnpm setup, `pnpm install --frozen-lockfile`, `pnpm lint`,
`pnpm typecheck`, `pnpm build` (with dummy `NEXT_PUBLIC_*` values).

## Security notes

- No secrets in the repo; `.env*` in `.gitignore` (keep `.env.example`).
- The contract holds no ETH and has no payable functions.
- Owner-only functions use OpenZeppelin `Ownable`.
- Frontend never asks for anything but a wallet connection and transaction signatures.

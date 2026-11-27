# Botohan

A small poll app where every vote is an Ethereum transaction on **Sepolia**. Built as a live demo for
the Davao DeFi Community workshop "Intro to Smart Contract Development": students vote from their
MetaMask wallets and the room watches the results and the raw transactions appear live.

- **Contract:** [`0x901fb78eC268f1c92a8a4D8a7f63bB43B6d3BD27`](https://sepolia.etherscan.io/address/0x901fb78eC268f1c92a8a4D8a7f63bB43B6d3BD27#code)
  on Sepolia (verified), deployed in block 12219275
- **App:** Next.js + wagmi, hosted on Vercel
- **Docs:** [`docs/`](docs/), starting with [`docs/PRD.md`](docs/PRD.md)

## Pages

| Page | What it does |
| --- | --- |
| `/` | All polls, grouped Open / Upcoming / Closed |
| `/poll/[id]` | Vote, live results, recent votes with Etherscan links |
| `/poll/[id]/present` | Projector view: big results, QR code to the vote page, live feed. Press `F` for full screen |
| `/admin` | Owner wallet only: create polls, add allowed wallets to restricted polls, close polls |

## Repository

```
contracts/   Foundry project: Botohan.sol, tests, deploy and seed scripts
web/         Next.js app (App Router, wagmi 3, viem 2, Tailwind)
docs/        Product, technical and design docs
```

## Run it locally

You need Node 24, pnpm (the version in `web/package.json`; `corepack enable` picks it up), and
[Foundry](https://getfoundry.sh) for the contract.

```bash
git clone --recurse-submodules https://github.com/MatchanJJ/botohan.git
cd botohan

# Contract: build, test, format check
cd contracts
forge build && forge test -vvv && forge fmt --check

# Web app
cd ../web
cp .env.example .env.local     # then edit .env.local (see below)
pnpm install
pnpm dev                       # http://localhost:3000
```

Checks that CI runs on every PR:

```bash
cd web && pnpm lint && pnpm typecheck && pnpm test && pnpm build
cd contracts && forge fmt --check && forge build --sizes && forge test -vvv
```

### Environment variables (`web/.env.local`, and Vercel)

All of these end up in the browser bundle, so none of them may be a secret.

| Name | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/<key>` | Use an Alchemy (or Infura) key for the workshop and restrict it to the site's domain. The public node in `.env.example` is fine for development but drops log history older than ~1.4 days, so the vote feed would lose older votes |
| `NEXT_PUBLIC_DEPLOY_BLOCK` | `12219275` | First block searched for vote events |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-app>.vercel.app` | Used for the QR code in present mode. Falls back to the current address if unset |

The contract address is not an env var: it comes from `web/src/generated.ts`, which
`pnpm wagmi generate` builds from `contracts/deployments/sepolia.json`.

## Contract

`contracts/src/Botohan.sol` (OpenZeppelin `Ownable`) holds every poll. The owner creates polls
(2–10 options, a start and end time, open or restricted), adds allowed wallets to restricted polls,
and can close a poll early. Anyone can vote once per poll. Votes can't be changed, not even by the
owner. See [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md).

### Deploying a new contract

Only needed if the contract changes. The deployer key lives in an encrypted Foundry keystore,
never in a file.

```bash
cd contracts
cast wallet import deployer --interactive        # once
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<key>"
export ETHERSCAN_API_KEY="<etherscan key>"       # from etherscan.io, 34 characters

forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify
BOTOHAN_ADDRESS=0x… forge script script/SeedPoll.s.sol --rpc-url sepolia --account deployer --broadcast
```

Then put the new address and the deploy block (the `Block:` in forge's receipt output) in
`contracts/deployments/sepolia.json`, run `pnpm wagmi generate` in `web/`, and update
`NEXT_PUBLIC_DEPLOY_BLOCK`.

## Deploying the web app (Vercel)

1. Vercel → **Add New → Project** → import `MatchanJJ/botohan`.
2. **Root Directory:** `web`. Framework preset: Next.js (detected).
3. **Environment Variables** (Production and Preview): the three above, plus
   `ENABLE_EXPERIMENTAL_COREPACK=1` so Vercel installs the pnpm version pinned in `package.json`.
4. Deploy. Every PR then gets its own preview URL.
5. Set `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy, so the QR code points there.
6. In the Alchemy dashboard, restrict the key to the Vercel domain. Use a separate unrestricted key in
   `.env.local` for localhost.

## Workshop checklist

- [ ] Demo poll open for the workshop window (the seed poll closes 3 Dec 2026; create a new one in `/admin` if needed)
- [ ] Deployer and 2 test wallets have Sepolia ETH
- [ ] Present mode tested on the projector resolution
- [ ] Phone test in the MetaMask mobile in-app browser
- [ ] Screenshots of present mode as a backup in case the network fails

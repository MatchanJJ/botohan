# Implementation Plan: Botohan

Build phase by phase. Each phase = one branch = one PR. Stop after each PR for Mark's review.
Steps marked **[Mark]** need his accounts or keys: prepare the commands, then ask him to run them.

## Phase 0: Repo setup

Branch: `chore/repo-setup`

- Create `botohan/` monorepo: `contracts/`, `web/`, `docs/` (copy these docs), `CLAUDE.md`,
  `README.md`, `.gitignore` (node, Next.js, Foundry `out/` `cache/` `broadcast/`, `.env*` except
  `.env.example`), `.editorconfig`.
- `forge init contracts --no-git`; install OpenZeppelin Contracts 5.x (`forge install`).
- `pnpm create next-app web` (TypeScript, App Router, ESLint, `src/`).
- Add `.github/workflows/contracts.yml` and `web.yml` (see TRD.md).
- **[Mark]** Create the GitHub repo `MatchanJJ/botohan` and push `main` with an initial commit.

Done when: both workflows run green on the PR.

Commits: `chore: scaffold foundry and next.js projects`, `chore(ci): add contracts and web workflows`,
`docs: add planning docs and CLAUDE.md`

## Phase 1: Voting contract

Branch: `feature/voting-contract`

- Implement `contracts/src/Botohan.sol` exactly as in BACKEND_SCHEMA.md.
- Write `test/Botohan.t.sol` covering every case listed there, including the fuzz test.
- NatSpec comments on every public function (students may read the verified source on Etherscan).

Done when: `forge test` passes, `forge coverage` ≥ 95% lines, `forge fmt --check` clean.

Commits: `feat(contracts): add poll creation with validation`, `feat(contracts): add voting with
double-vote and allowlist checks`, `feat(contracts): add addVoters and closePoll`,
`test(contracts): cover errors and fuzz vote totals`

## Phase 2: Deploy to Sepolia

Branch: `feature/sepolia-deploy`

- `script/Deploy.s.sol`: deploys `Botohan`, logs address.
- `script/SeedPoll.s.sol`: creates the seed poll from BACKEND_SCHEMA.md.
- `foundry.toml`: `rpc_endpoints` and `etherscan` sections using env vars.
- **[Mark]** `cast wallet import deployer --interactive`, fund it with Sepolia ETH, then run:
  `forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify`
  and the seed script.
- Record `{ "Botohan": "0x…", "deployBlock": N }` in `contracts/deployments/sepolia.json`.

Done when: contract is verified on sepolia.etherscan.io and the seed poll is readable with
`cast call`.

## Phase 3: Web scaffold and wallet

Branch: `feature/web-wallet`

- Install wagmi 3, viem 2, @tanstack/react-query 5, @wagmi/cli.
- `wagmi.config.ts` with the `foundry` plugin (`project: '../contracts'`, deployment address for
  Sepolia); run `pnpm wagmi generate`; commit `src/generated.ts`.
- `src/lib/wagmi.ts` (see TRD.md), `providers.tsx`, root layout with fonts and design tokens.
- Header: app name, network badge, connect / switch network / disconnect states (APP_FLOW.md).
- `.env.example` with all `NEXT_PUBLIC_*` vars.

Done when: on localhost, MetaMask connects, wrong network shows "Switch to Sepolia" and switching
works; build, lint, typecheck pass.

## Phase 4: Polls and voting

Branch: `feature/vote-flow`

- `/`: poll list via multicall, grouped Open / Upcoming / Closed, with vote counts and time left.
- `/poll/[id]`: options, vote button state machine, pre-checks (`hasVoted`, `isAllowed`),
  error message mapping (APP_FLOW.md), Etherscan links.
- Results bars on the vote page (static refetch for now).

Done when: Mark can vote from two wallets on localhost; the second vote from the same wallet shows
"You already voted in this poll" before signing.

## Phase 5: Live results and present mode

Branch: `feature/live-results`

- `useWatchContractEvent` on `VoteCast`, query invalidation, 12 s fallback refetch.
- Recent-votes feed with initial `getContractEvents` from `deployBlock`.
- `/poll/[id]/present`: layout from DESIGN_BRIEF.md, QR code, countdown, `F` for full screen.
- Bars ease to new widths; reduced-motion respected.

Done when: with the present page open in one browser and a vote cast from another, the present
page updates within 15 s without a reload.

## Phase 6: Admin

Branch: `feature/admin`

- Owner check via `owner()`.
- Create poll form with validation matching the contract limits.
- Add voters: paste/CSV, `isAddress` validation, dedupe, batches of 200, progress.
- Close poll with confirm dialog.

Done when: Mark creates a 10-minute restricted poll, adds 3 addresses, votes from an allowed and a
non-allowed wallet (the latter sees the "registered wallets only" message), then closes it early.

## Phase 7: Vercel deploy and workshop prep

Branch: `chore/vercel-deploy`

- `README.md`: what it is, local setup, env vars, deploy steps, contract address.
- **[Mark]** Create the Vercel project from the GitHub repo (root directory `web`), set the
  `NEXT_PUBLIC_*` env vars, restrict the RPC key to the Vercel domain.
- Test on a phone through the MetaMask mobile in-app browser.

Done when: production URL works end to end on laptop and phone; the CI and preview deploys pass.

## Workshop demo script (about 10 minutes, after the ERC-20 activity)

1. Show the verified contract on Etherscan: point out `struct Poll`, the mappings, `onlyOwner`,
   `VoteCast`, the custom errors. These are the slides they just saw.
2. Open present mode on the projector. Students scan the QR code and vote.
3. Watch bars move and the feed fill. Open one vote on Etherscan.
4. Ask someone to vote twice: the app (and the contract) rejects it.
5. Discuss: "I have 3 wallets, can I vote 3 times?" Yes in an open poll. Create a restricted poll
   with the registration form addresses to fix it.
6. Close the poll from admin. Ask: who can change these results now? Nobody.

## Rehearsal checklist (day before)

- [ ] Deployer wallet and 2 test wallets have Sepolia ETH
- [ ] Demo poll created, open for the workshop window
- [ ] Present mode tested on the projector resolution
- [ ] RPC provider key set and domain-restricted
- [ ] Phone test through MetaMask mobile browser
- [ ] Backup: screenshots of present mode in case the network fails

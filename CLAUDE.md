# Botohan: On-Chain Voting dApp

A small voting app on Ethereum Sepolia, used as a live blockchain demo at the
Davao DeFi Community workshop "Intro to Smart Contract Development".
Students vote from their MetaMask wallets and watch results update on the projector.

Read these before writing code, in this order:

1. `docs/PRD.md`: what we're building and why
2. `docs/TRD.md`: stack, architecture, environment, CI
3. `docs/BACKEND_SCHEMA.md`: the smart contract (storage, functions, events, errors)
4. `docs/APP_FLOW.md`: screens and user flows
5. `docs/DESIGN_BRIEF.md`: visual design
6. `docs/IMPLEMENTATION_PLAN.md`: phases, tasks, acceptance criteria

## How to work

- Build **one phase at a time**, in the order of `IMPLEMENTATION_PLAN.md`. Finish a phase's
  acceptance criteria, open a PR, and stop for review before starting the next phase.
- When a doc and the code disagree, the doc wins. If the doc is wrong, say so and propose an edit
  instead of silently diverging.
- Check current package versions before installing (`npm view <pkg> version`, `foundryup`).
  Target: Next.js 16.x, wagmi 3.x, viem 2.x, @tanstack/react-query 5.x, OpenZeppelin Contracts 5.x,
  Foundry ≥ 1.8. wagmi 3 renamed hooks (`useAccount` → `useConnection`); use the wagmi 3 docs.

## Git rules

- Never push to `main`. Work on a branch, open a PR on the `MatchanJJ` GitHub account.
- Branch names follow conventionalbranch.org: `feature/voting-contract`, `chore/repo-setup`,
  `fix/vote-button-state`.
- Small commits in Conventional Commits format (qoomon gist):
  `feat(contracts): add vote with double-vote check`, `test(contracts): fuzz vote counts`,
  `chore(ci): add foundry workflow`.
- **No `Co-Authored-By` lines** in commit messages.
- Every PR must pass CI (contracts + web workflows).

## Accounts, keys and secrets: ask first

- **Never** create, read, print or commit private keys, seed phrases or `.env` files with secrets.
- Deploying to Sepolia, verifying on Etherscan, creating the Vercel project and setting env vars
  are done by **Mark**. Prepare the exact commands, then stop and ask him to run them.
- Deployer key lives in a Foundry encrypted keystore (`cast wallet import deployer --interactive`),
  never in plain text.

## Commands

```bash
# contracts
cd contracts && forge build && forge test -vvv && forge fmt --check

# web
cd web && pnpm install && pnpm lint && pnpm typecheck && pnpm build
pnpm wagmi generate   # regenerate typed ABI after contract changes
```

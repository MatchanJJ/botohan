# PRD: Botohan (On-Chain Voting dApp)

## Summary

Botohan is a simple poll app where every vote is an Ethereum transaction on Sepolia. It exists to
show workshop students a real blockchain use case: they vote with the wallets they set up for the
workshop, and the room watches the results and the raw transactions appear live.

## Goals

1. Students can vote in a poll from their own MetaMask wallet in under 1 minute.
2. Results update live on a projector screen as votes land, with a link to each transaction.
3. The contract demonstrates the concepts from the workshop: `struct`, `mapping`, `modifier`
   (`onlyOwner`), `event`, custom errors, `require`-style checks, OpenZeppelin inheritance.
4. The app makes blockchain's trade-offs visible, not just its strengths (see Talking points).

## Users

| User | Needs |
| --- | --- |
| Student (voter) | Connect wallet, see open polls, vote once, see that the vote counted |
| Mark (owner/presenter) | Create polls, restrict a poll to registered wallets, close polls, show results on a projector |
| Anyone watching | See live results and verify any vote on Etherscan |

## Scope

### In scope (MVP)

- One contract on Sepolia holding many polls.
- Owner creates a poll: title, 2–10 options, start time, end time, open or restricted.
- One vote per wallet per poll. Votes can't be changed.
- Restricted polls: owner adds allowed wallet addresses (e.g. pasted from the workshop
  registration sheet).
- Owner can close a poll early.
- Web app: poll list, vote page, live results, recent-votes feed, projector ("Present") mode with a
  QR code, owner-only admin page.
- Deployed on Vercel. Contract verified on Etherscan.

### Out of scope

- Secret ballots (all votes are public by design; this is a talking point).
- Mainnet deployment, gasless voting, sign-in with email, ENS names, mobile app.
- Editing or deleting polls after creation.

## Success criteria for the workshop

- 30+ students can vote in the same poll within 5 minutes without the app breaking.
- The projector view updates within ~15 seconds of a vote being confirmed.
- A double vote is rejected with a clear message ("You already voted in this poll").
- Mark can create a new poll from the admin page during the talk in under 1 minute.

## Talking points the demo should support

- **Transparency:** anyone can recount the votes from the events on Etherscan.
- **Immutability:** a cast vote can't be edited or deleted, not even by the owner.
- **One wallet is not one person:** in open polls, a student with 3 wallets gets 3 votes.
  Restricted polls fix this by allowing only registered addresses.
- **No privacy:** everyone can see which address voted for what.
- **Cost:** every vote costs gas; free on testnet, real money on mainnet.

## Open questions

- Workshop date and expected number of students (affects RPC provider choice).
- Should the first demo poll be open or restricted to the registration form addresses?

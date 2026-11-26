# Backend Schema: `Botohan.sol`

There is no server or database. The smart contract is the backend, and its storage is the database.

## Contract

```
contract Botohan is Ownable   // OpenZeppelin 5.x, constructor: Ownable(msg.sender)
```

## Storage

```solidity
struct Poll {
    string title;          // 1–100 bytes
    string[] options;      // 2–10 options, each 1–50 bytes
    uint64 startsAt;       // unix seconds
    uint64 endsAt;         // unix seconds, > startsAt
    bool restricted;       // true = only allowed wallets can vote
    uint256 totalVotes;
}

uint256 public pollCount;                                              // ids are 0..pollCount-1
mapping(uint256 pollId => Poll) internal _polls;
mapping(uint256 pollId => mapping(uint256 option => uint256)) internal _votes;
mapping(uint256 pollId => mapping(address voter => bool)) public hasVoted;
mapping(uint256 pollId => mapping(address voter => bool)) public isAllowed;
```

## Functions

| Function | Access | Behavior |
| --- | --- | --- |
| `createPoll(string title, string[] options, uint64 startsAt, uint64 endsAt, bool restricted) returns (uint256 pollId)` | `onlyOwner` | Validates inputs, stores poll, emits `PollCreated` |
| `addVoters(uint256 pollId, address[] voters)` | `onlyOwner` | Sets `isAllowed` true for each (skips duplicates and `address(0)`), emits `VotersAdded` with the count actually added. Max 200 per call |
| `closePoll(uint256 pollId)` | `onlyOwner` | Sets `endsAt = block.timestamp` if the poll hasn't ended, emits `PollClosed` |
| `vote(uint256 pollId, uint256 option)` | anyone | Checks, records vote, emits `VoteCast` |
| `getPoll(uint256 pollId) view returns (Poll memory)` | anyone | Full poll struct |
| `getResults(uint256 pollId) view returns (uint256[] memory)` | anyone | Vote count per option, same order as `options` |
| `status(uint256 pollId) view returns (Status)` | anyone | `enum Status { Upcoming, Open, Closed }` from `block.timestamp` |

### `vote` checks, in order

1. Poll exists, else `PollNotFound(pollId)`
2. `startsAt <= block.timestamp < endsAt`, else `PollNotOpen(pollId)`
3. `option < options.length`, else `InvalidOption(option)`
4. Not restricted, or `isAllowed[pollId][msg.sender]`, else `NotAllowed(msg.sender)`
5. `!hasVoted[pollId][msg.sender]`, else `AlreadyVoted(msg.sender)`
6. Effects: `hasVoted = true`, `_votes[pollId][option]++`, `totalVotes++`
7. `emit VoteCast(pollId, msg.sender, option)`

## Events

```solidity
event PollCreated(uint256 indexed pollId, string title, uint256 optionCount, uint64 startsAt, uint64 endsAt, bool restricted);
event VoteCast(uint256 indexed pollId, address indexed voter, uint256 option);
event VotersAdded(uint256 indexed pollId, uint256 count);
event PollClosed(uint256 indexed pollId, uint64 closedAt);
```

## Custom errors

```solidity
error PollNotFound(uint256 pollId);
error PollNotOpen(uint256 pollId);
error InvalidOption(uint256 option);
error NotAllowed(address voter);
error AlreadyVoted(address voter);
error InvalidTitle();
error InvalidOptions();          // count outside 2–10, or an empty/too-long option
error InvalidSchedule();         // endsAt <= startsAt, or endsAt <= block.timestamp
error TooManyVoters();           // addVoters batch > 200
```

The frontend maps each error to a plain message (see APP_FLOW.md).

## Tests (`test/Botohan.t.sol`)

- Owner can create a poll; non-owner reverts with `OwnableUnauthorizedAccount`.
- Every `createPoll` validation error.
- Vote happy path: counts, `totalVotes`, `hasVoted`, `VoteCast` event.
- Every `vote` error: not found, upcoming, ended, closed early, invalid option, not allowed,
  double vote.
- Restricted poll: allowed voter succeeds, others revert; `addVoters` skips duplicates.
- `closePoll` stops voting; closing an ended poll does nothing.
- Fuzz: random voters and options; sum of `getResults` always equals `totalVotes`.
- Target: ≥ 95% line coverage (`forge coverage`).

## Seed poll (`script/SeedPoll.s.sol`)

Creates the first demo poll, open for 7 days:

- Title: "What should Davao DeFi Community build next?"
- Options: "Campus event tickets as NFTs", "Org treasury with on-chain voting",
  "Attendance badges", "Student marketplace with stablecoins"

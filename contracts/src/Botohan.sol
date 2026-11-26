// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Botohan: on-chain polls for the Davao DeFi Community workshop
/// @notice Every vote is a public transaction. Anyone can recount the votes from the `VoteCast` events.
/// @dev One contract holds many polls. Poll ids run from 0 to `pollCount - 1`.
contract Botohan is Ownable {
    /// @notice A poll and its settings.
    struct Poll {
        string title; // 1–100 bytes
        string[] options; // 2–10 options, each 1–50 bytes
        uint64 startsAt; // unix seconds
        uint64 endsAt; // unix seconds, > startsAt
        bool restricted; // true = only allowed wallets can vote
        uint256 totalVotes;
    }

    /// @notice Where a poll is in its lifetime, based on `block.timestamp`.
    enum Status {
        Upcoming,
        Open,
        Closed
    }

    uint256 internal constant MAX_TITLE_BYTES = 100;
    uint256 internal constant MIN_OPTIONS = 2;
    uint256 internal constant MAX_OPTIONS = 10;
    uint256 internal constant MAX_OPTION_BYTES = 50;
    uint256 internal constant MAX_VOTERS_PER_CALL = 200;

    /// @notice Number of polls created so far.
    uint256 public pollCount;

    mapping(uint256 pollId => Poll) internal _polls;
    mapping(uint256 pollId => mapping(uint256 option => uint256)) internal _votes;

    /// @notice True once `voter` has voted in `pollId`.
    mapping(uint256 pollId => mapping(address voter => bool)) public hasVoted;

    /// @notice True if `voter` may vote in the restricted poll `pollId`.
    mapping(uint256 pollId => mapping(address voter => bool)) public isAllowed;

    event PollCreated(
        uint256 indexed pollId, string title, uint256 optionCount, uint64 startsAt, uint64 endsAt, bool restricted
    );
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 option);
    event VotersAdded(uint256 indexed pollId, uint256 count);
    event PollClosed(uint256 indexed pollId, uint64 closedAt);

    error PollNotFound(uint256 pollId);
    error PollNotOpen(uint256 pollId);
    error InvalidOption(uint256 option);
    error NotAllowed(address voter);
    error AlreadyVoted(address voter);
    error InvalidTitle();
    error InvalidOptions();
    error InvalidSchedule();
    error TooManyVoters();

    /// @notice The deployer becomes the owner, who can create and manage polls.
    constructor() Ownable(msg.sender) {}

    /// @notice Create a new poll. Owner only.
    /// @param title Poll question, 1–100 bytes.
    /// @param options 2–10 answer choices, each 1–50 bytes.
    /// @param startsAt Unix time when voting opens.
    /// @param endsAt Unix time when voting closes. Must be after `startsAt` and in the future.
    /// @param restricted If true, only wallets added with `addVoters` can vote.
    /// @return pollId The id of the new poll.
    function createPoll(
        string calldata title,
        string[] calldata options,
        uint64 startsAt,
        uint64 endsAt,
        bool restricted
    ) external onlyOwner returns (uint256 pollId) {
        uint256 titleLength = bytes(title).length;
        if (titleLength == 0 || titleLength > MAX_TITLE_BYTES) revert InvalidTitle();
        if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) revert InvalidOptions();
        if (endsAt <= startsAt || endsAt <= block.timestamp) revert InvalidSchedule();

        pollId = pollCount++;
        Poll storage poll = _polls[pollId];
        poll.title = title;
        poll.startsAt = startsAt;
        poll.endsAt = endsAt;
        poll.restricted = restricted;
        for (uint256 i; i < options.length; ++i) {
            uint256 optionLength = bytes(options[i]).length;
            if (optionLength == 0 || optionLength > MAX_OPTION_BYTES) revert InvalidOptions();
            poll.options.push(options[i]);
        }

        emit PollCreated(pollId, title, options.length, startsAt, endsAt, restricted);
    }

    /// @notice Allow wallets to vote in a restricted poll. Owner only.
    /// @dev Skips `address(0)` and wallets already allowed. Emits the number actually added.
    /// @param pollId The poll to add voters to.
    /// @param voters Up to 200 wallet addresses per call.
    function addVoters(uint256 pollId, address[] calldata voters) external onlyOwner {
        _existing(pollId);
        if (voters.length > MAX_VOTERS_PER_CALL) revert TooManyVoters();

        uint256 added = 0;
        for (uint256 i; i < voters.length; ++i) {
            address voter = voters[i];
            if (voter == address(0) || isAllowed[pollId][voter]) continue;
            isAllowed[pollId][voter] = true;
            ++added;
        }

        emit VotersAdded(pollId, added);
    }

    /// @notice End a poll now instead of at its scheduled end. Owner only.
    /// @dev Does nothing if the poll has already ended. Votes already cast stay as they are.
    /// @param pollId The poll to close.
    function closePoll(uint256 pollId) external onlyOwner {
        Poll storage poll = _existing(pollId);
        if (block.timestamp >= poll.endsAt) return;

        // Safe: block.timestamp < endsAt here, and endsAt is a uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 closedAt = uint64(block.timestamp);
        poll.endsAt = closedAt;
        emit PollClosed(pollId, closedAt);
    }

    /// @notice Cast your vote. One vote per wallet per poll, and it can't be changed.
    /// @param pollId The poll to vote in.
    /// @param option Index of the chosen option in the poll's `options`.
    function vote(uint256 pollId, uint256 option) external {
        Poll storage poll = _existing(pollId);
        if (block.timestamp < poll.startsAt || block.timestamp >= poll.endsAt) revert PollNotOpen(pollId);
        if (option >= poll.options.length) revert InvalidOption(option);
        if (poll.restricted && !isAllowed[pollId][msg.sender]) revert NotAllowed(msg.sender);
        if (hasVoted[pollId][msg.sender]) revert AlreadyVoted(msg.sender);

        hasVoted[pollId][msg.sender] = true;
        _votes[pollId][option]++;
        poll.totalVotes++;

        emit VoteCast(pollId, msg.sender, option);
    }

    /// @notice Get a poll's full details.
    /// @param pollId The poll to read.
    function getPoll(uint256 pollId) external view returns (Poll memory) {
        return _existing(pollId);
    }

    /// @notice Vote count per option, in the same order as the poll's `options`.
    /// @param pollId The poll to read.
    function getResults(uint256 pollId) external view returns (uint256[] memory results) {
        uint256 optionCount = _existing(pollId).options.length;
        results = new uint256[](optionCount);
        for (uint256 i; i < optionCount; ++i) {
            results[i] = _votes[pollId][i];
        }
    }

    /// @notice Whether a poll is upcoming, open or closed right now.
    /// @param pollId The poll to read.
    function status(uint256 pollId) external view returns (Status) {
        Poll storage poll = _existing(pollId);
        if (block.timestamp >= poll.endsAt) return Status.Closed;
        if (block.timestamp < poll.startsAt) return Status.Upcoming;
        return Status.Open;
    }

    function _existing(uint256 pollId) internal view returns (Poll storage) {
        if (pollId >= pollCount) revert PollNotFound(pollId);
        return _polls[pollId];
    }
}

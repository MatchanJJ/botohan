// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Botohan} from "../src/Botohan.sol";

contract BotohanTest is Test {
    Botohan internal botohan;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint64 internal constant DURATION = 1 hours;

    event PollCreated(
        uint256 indexed pollId, string title, uint256 optionCount, uint64 startsAt, uint64 endsAt, bool restricted
    );
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 option);
    event VotersAdded(uint256 indexed pollId, uint256 count);
    event PollClosed(uint256 indexed pollId, uint64 closedAt);

    function setUp() public {
        vm.warp(1_700_000_000);
        vm.prank(owner);
        botohan = new Botohan();
    }

    // ---------- helpers ----------

    function _options(uint256 n) internal pure returns (string[] memory opts) {
        opts = new string[](n);
        for (uint256 i; i < n; ++i) {
            opts[i] = string.concat("Option ", vm.toString(i));
        }
    }

    function _now() internal view returns (uint64) {
        return uint64(block.timestamp);
    }

    function _createOpenPoll(bool restricted) internal returns (uint256) {
        vm.prank(owner);
        return botohan.createPoll("Best chain?", _options(4), _now(), _now() + DURATION, restricted);
    }

    function _create(string memory title, string[] memory opts, uint64 startsAt, uint64 endsAt) internal {
        vm.prank(owner);
        botohan.createPoll(title, opts, startsAt, endsAt, false);
    }

    function _one(address a) internal pure returns (address[] memory list) {
        list = new address[](1);
        list[0] = a;
    }

    // ---------- createPoll ----------

    function test_CreatePoll_StoresPollAndEmits() public {
        uint64 start = _now() + 10;
        uint64 end = start + DURATION;

        vm.expectEmit(address(botohan));
        emit PollCreated(0, "Best chain?", 3, start, end, true);
        vm.prank(owner);
        uint256 id = botohan.createPoll("Best chain?", _options(3), start, end, true);

        assertEq(id, 0);
        assertEq(botohan.pollCount(), 1);
        Botohan.Poll memory poll = botohan.getPoll(0);
        assertEq(poll.title, "Best chain?");
        assertEq(poll.options.length, 3);
        assertEq(poll.options[2], "Option 2");
        assertEq(poll.startsAt, start);
        assertEq(poll.endsAt, end);
        assertTrue(poll.restricted);
        assertEq(poll.totalVotes, 0);
        assertEq(uint256(botohan.status(0)), uint256(Botohan.Status.Upcoming));

        assertEq(_createOpenPoll(false), 1);
    }

    function test_CreatePoll_RevertsForNonOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        botohan.createPoll("Title", _options(2), _now(), _now() + DURATION, false);
    }

    function test_CreatePoll_AcceptsLimits() public {
        string[] memory opts = _options(10);
        opts[0] = string(new bytes(50));
        _create(string(new bytes(100)), opts, _now(), _now() + 1);
        _create("T", _options(2), _now(), _now() + 1);
        assertEq(botohan.pollCount(), 2);
    }

    function test_CreatePoll_RevertsOnEmptyTitle() public {
        vm.expectRevert(Botohan.InvalidTitle.selector);
        _create("", _options(2), _now(), _now() + DURATION);
    }

    function test_CreatePoll_RevertsOnLongTitle() public {
        vm.expectRevert(Botohan.InvalidTitle.selector);
        _create(string(new bytes(101)), _options(2), _now(), _now() + DURATION);
    }

    function test_CreatePoll_RevertsOnTooFewOptions() public {
        vm.expectRevert(Botohan.InvalidOptions.selector);
        _create("Title", _options(1), _now(), _now() + DURATION);
    }

    function test_CreatePoll_RevertsOnTooManyOptions() public {
        vm.expectRevert(Botohan.InvalidOptions.selector);
        _create("Title", _options(11), _now(), _now() + DURATION);
    }

    function test_CreatePoll_RevertsOnEmptyOption() public {
        string[] memory opts = _options(3);
        opts[1] = "";
        vm.expectRevert(Botohan.InvalidOptions.selector);
        _create("Title", opts, _now(), _now() + DURATION);
    }

    function test_CreatePoll_RevertsOnLongOption() public {
        string[] memory opts = _options(3);
        opts[2] = string(new bytes(51));
        vm.expectRevert(Botohan.InvalidOptions.selector);
        _create("Title", opts, _now(), _now() + DURATION);
    }

    function test_CreatePoll_RevertsWhenEndNotAfterStart() public {
        vm.expectRevert(Botohan.InvalidSchedule.selector);
        _create("Title", _options(2), _now() + 100, _now() + 100);
    }

    function test_CreatePoll_RevertsWhenEndInPast() public {
        vm.expectRevert(Botohan.InvalidSchedule.selector);
        _create("Title", _options(2), _now() - 100, _now());
    }

    // ---------- vote ----------

    function test_Vote_RecordsAndEmits() public {
        uint256 id = _createOpenPoll(false);

        vm.expectEmit(address(botohan));
        emit VoteCast(id, alice, 2);
        vm.prank(alice);
        botohan.vote(id, 2);

        vm.prank(bob);
        botohan.vote(id, 2);

        uint256[] memory results = botohan.getResults(id);
        assertEq(results.length, 4);
        assertEq(results[0], 0);
        assertEq(results[2], 2);
        assertEq(botohan.getPoll(id).totalVotes, 2);
        assertTrue(botohan.hasVoted(id, alice));
        assertFalse(botohan.hasVoted(id, makeAddr("carol")));
        assertEq(uint256(botohan.status(id)), uint256(Botohan.Status.Open));
    }

    function test_Vote_RevertsWhenPollNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotFound.selector, 0));
        vm.prank(alice);
        botohan.vote(0, 0);
    }

    function test_Vote_RevertsWhenUpcoming() public {
        vm.prank(owner);
        uint256 id = botohan.createPoll("Later", _options(2), _now() + 60, _now() + DURATION, false);
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotOpen.selector, id));
        vm.prank(alice);
        botohan.vote(id, 0);
    }

    function test_Vote_RevertsWhenEnded() public {
        uint256 id = _createOpenPoll(false);
        vm.warp(block.timestamp + DURATION);
        assertEq(uint256(botohan.status(id)), uint256(Botohan.Status.Closed));
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotOpen.selector, id));
        vm.prank(alice);
        botohan.vote(id, 0);
    }

    function test_Vote_RevertsWhenClosedEarly() public {
        uint256 id = _createOpenPoll(false);
        vm.prank(owner);
        botohan.closePoll(id);
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotOpen.selector, id));
        vm.prank(alice);
        botohan.vote(id, 0);
    }

    function test_Vote_RevertsOnInvalidOption() public {
        uint256 id = _createOpenPoll(false);
        vm.expectRevert(abi.encodeWithSelector(Botohan.InvalidOption.selector, 4));
        vm.prank(alice);
        botohan.vote(id, 4);
    }

    function test_Vote_RevertsWhenNotAllowed() public {
        uint256 id = _createOpenPoll(true);
        vm.expectRevert(abi.encodeWithSelector(Botohan.NotAllowed.selector, alice));
        vm.prank(alice);
        botohan.vote(id, 0);
    }

    function test_Vote_RevertsOnDoubleVote() public {
        uint256 id = _createOpenPoll(false);
        vm.startPrank(alice);
        botohan.vote(id, 0);
        vm.expectRevert(abi.encodeWithSelector(Botohan.AlreadyVoted.selector, alice));
        botohan.vote(id, 1);
        vm.stopPrank();
    }

    // ---------- restricted polls / addVoters ----------

    function test_Restricted_AllowedVoterSucceedsOthersRevert() public {
        uint256 id = _createOpenPoll(true);
        vm.prank(owner);
        botohan.addVoters(id, _one(alice));

        assertTrue(botohan.isAllowed(id, alice));
        vm.prank(alice);
        botohan.vote(id, 1);
        assertEq(botohan.getResults(id)[1], 1);

        vm.expectRevert(abi.encodeWithSelector(Botohan.NotAllowed.selector, bob));
        vm.prank(bob);
        botohan.vote(id, 1);
    }

    function test_AddVoters_SkipsDuplicatesAndZeroAddress() public {
        uint256 id = _createOpenPoll(true);
        address[] memory list = new address[](4);
        list[0] = alice;
        list[1] = alice;
        list[2] = address(0);
        list[3] = bob;

        vm.expectEmit(address(botohan));
        emit VotersAdded(id, 2);
        vm.prank(owner);
        botohan.addVoters(id, list);

        // Already-allowed wallets are skipped on later calls too.
        vm.expectEmit(address(botohan));
        emit VotersAdded(id, 0);
        vm.prank(owner);
        botohan.addVoters(id, _one(bob));

        assertTrue(botohan.isAllowed(id, alice));
        assertTrue(botohan.isAllowed(id, bob));
        assertFalse(botohan.isAllowed(id, address(0)));
    }

    function test_AddVoters_AcceptsTwoHundred() public {
        uint256 id = _createOpenPoll(true);
        address[] memory list = new address[](200);
        for (uint256 i; i < 200; ++i) {
            list[i] = address(uint160(i + 1));
        }
        vm.expectEmit(address(botohan));
        emit VotersAdded(id, 200);
        vm.prank(owner);
        botohan.addVoters(id, list);
    }

    function test_AddVoters_RevertsOverTwoHundred() public {
        uint256 id = _createOpenPoll(true);
        vm.expectRevert(Botohan.TooManyVoters.selector);
        vm.prank(owner);
        botohan.addVoters(id, new address[](201));
    }

    function test_AddVoters_RevertsForNonOwner() public {
        uint256 id = _createOpenPoll(true);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        botohan.addVoters(id, _one(alice));
    }

    function test_AddVoters_RevertsWhenPollNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotFound.selector, 7));
        vm.prank(owner);
        botohan.addVoters(7, _one(alice));
    }

    // ---------- closePoll ----------

    function test_ClosePoll_StopsVotingAndEmits() public {
        uint256 id = _createOpenPoll(false);
        vm.prank(alice);
        botohan.vote(id, 0);

        vm.warp(block.timestamp + 5 minutes);
        vm.expectEmit(address(botohan));
        emit PollClosed(id, _now());
        vm.prank(owner);
        botohan.closePoll(id);

        assertEq(botohan.getPoll(id).endsAt, _now());
        assertEq(uint256(botohan.status(id)), uint256(Botohan.Status.Closed));
        assertEq(botohan.getResults(id)[0], 1, "votes already cast stay");
    }

    function test_ClosePoll_UpcomingPollShowsClosed() public {
        vm.prank(owner);
        uint256 id = botohan.createPoll("Later", _options(2), _now() + 60, _now() + DURATION, false);
        vm.prank(owner);
        botohan.closePoll(id);
        assertEq(uint256(botohan.status(id)), uint256(Botohan.Status.Closed));
    }

    function test_ClosePoll_EndedPollDoesNothing() public {
        uint256 id = _createOpenPoll(false);
        uint64 end = botohan.getPoll(id).endsAt;
        vm.warp(end + 1 days);

        vm.recordLogs();
        vm.prank(owner);
        botohan.closePoll(id);

        assertEq(vm.getRecordedLogs().length, 0);
        assertEq(botohan.getPoll(id).endsAt, end);
    }

    function test_ClosePoll_RevertsForNonOwner() public {
        uint256 id = _createOpenPoll(false);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        botohan.closePoll(id);
    }

    function test_ClosePoll_RevertsWhenPollNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotFound.selector, 0));
        vm.prank(owner);
        botohan.closePoll(0);
    }

    // ---------- views ----------

    function test_Views_RevertWhenPollNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotFound.selector, 3));
        botohan.getPoll(3);
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotFound.selector, 3));
        botohan.getResults(3);
        vm.expectRevert(abi.encodeWithSelector(Botohan.PollNotFound.selector, 3));
        botohan.status(3);
    }

    // ---------- fuzz ----------

    /// Random voters and options: the per-option counts always add up to totalVotes.
    function testFuzz_ResultsSumToTotalVotes(uint8 optionCount, uint8 voterCount, uint256 seed) public {
        optionCount = uint8(bound(optionCount, 2, 10));
        voterCount = uint8(bound(voterCount, 0, 60));

        vm.prank(owner);
        uint256 id = botohan.createPoll("Fuzz", _options(optionCount), _now(), _now() + DURATION, false);

        for (uint256 i; i < voterCount; ++i) {
            address voter = address(uint160(uint256(keccak256(abi.encode(seed, i)))));
            uint256 option = uint256(keccak256(abi.encode(seed, i, "option"))) % optionCount;
            vm.prank(voter);
            botohan.vote(id, option);
        }

        uint256[] memory results = botohan.getResults(id);
        uint256 sum;
        for (uint256 i; i < results.length; ++i) {
            sum += results[i];
        }
        assertEq(sum, botohan.getPoll(id).totalVotes);
        assertEq(sum, voterCount);
    }
}

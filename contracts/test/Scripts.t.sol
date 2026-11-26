// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Botohan} from "../src/Botohan.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {SeedPoll} from "../script/SeedPoll.s.sol";

/// Runs the deploy and seed scripts the way Mark will, against a local chain.
contract ScriptsTest is Test {
    function test_DeployThenSeed() public {
        Botohan botohan = new Deploy().run();

        vm.setEnv("BOTOHAN_ADDRESS", vm.toString(address(botohan)));
        uint256 pollId = new SeedPoll().run();

        assertEq(pollId, 0);
        Botohan.Poll memory poll = botohan.getPoll(0);
        assertEq(poll.title, "What should Davao DeFi Community build next?");
        assertEq(poll.options.length, 4);
        assertEq(poll.options[3], "Student marketplace with stablecoins");
        assertEq(poll.endsAt - poll.startsAt, 7 days);
        assertFalse(poll.restricted);
        assertEq(uint256(botohan.status(0)), uint256(Botohan.Status.Open));
    }
}

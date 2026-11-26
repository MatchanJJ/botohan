// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Botohan} from "../src/Botohan.sol";

/// @notice Creates the first demo poll (docs/BACKEND_SCHEMA.md), open now for 7 days. Owner only.
/// BOTOHAN_ADDRESS=0x… forge script script/SeedPoll.s.sol --rpc-url sepolia --account deployer --broadcast
contract SeedPoll is Script {
    function run() external returns (uint256 pollId) {
        Botohan botohan = Botohan(vm.envAddress("BOTOHAN_ADDRESS"));

        string[] memory options = new string[](4);
        options[0] = "Campus event tickets as NFTs";
        options[1] = "Org treasury with on-chain voting";
        options[2] = "Attendance badges";
        options[3] = "Student marketplace with stablecoins";

        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 startsAt = uint64(block.timestamp);

        vm.startBroadcast();
        pollId = botohan.createPoll(
            "What should Davao DeFi Community build next?", options, startsAt, startsAt + 7 days, false
        );
        vm.stopBroadcast();

        console.log("Seed poll id", pollId);
    }
}

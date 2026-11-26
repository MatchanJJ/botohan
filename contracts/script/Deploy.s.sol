// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Botohan} from "../src/Botohan.sol";

/// @notice Deploys Botohan. The broadcasting account becomes the owner.
/// forge script script/Deploy.s.sol --rpc-url sepolia --account deployer --broadcast --verify
contract Deploy is Script {
    function run() external returns (Botohan botohan) {
        vm.startBroadcast();
        botohan = new Botohan();
        vm.stopBroadcast();

        console.log("Botohan deployed at", address(botohan));
        console.log("Owner", botohan.owner());
        // The deploy block for deployments/sepolia.json is the "Block:" in forge's receipt output.
    }
}

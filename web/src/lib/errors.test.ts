import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeErrorResult,
  InsufficientFundsError,
  parseAbi,
  UserRejectedRequestError,
} from "viem";
import { messages, voteErrorMessage } from "./errors.ts";

const abi = parseAbi(["error AlreadyVoted(address voter)", "error NotAllowed(address voter)", "error InvalidTitle()"]);

function reverted(errorName: "AlreadyVoted" | "NotAllowed" | "InvalidTitle") {
  const args = errorName === "InvalidTitle" ? undefined : (["0x1c41e1d2Bb16B9EB62e469bFB6f1996D32e19A3C"] as const);
  const data = encodeErrorResult({ abi, errorName, args } as Parameters<typeof encodeErrorResult>[0]);
  // Wrapped one level deep, like viem's ContractFunctionExecutionError.
  return new BaseError("vote failed", { cause: new ContractFunctionRevertedError({ abi, data, functionName: "vote" }) });
}

test("maps contract reverts to APP_FLOW messages", () => {
  assert.equal(voteErrorMessage(reverted("AlreadyVoted")), messages.AlreadyVoted);
  assert.equal(voteErrorMessage(reverted("NotAllowed")), messages.NotAllowed);
});

test("maps wallet errors", () => {
  assert.equal(voteErrorMessage(new UserRejectedRequestError(new Error("denied"))), messages.rejected);
  assert.equal(voteErrorMessage(new InsufficientFundsError()), messages.noGas);
});

test("falls back to the generic message", () => {
  assert.equal(voteErrorMessage(reverted("InvalidTitle")), messages.generic);
  assert.equal(voteErrorMessage(new Error("boom")), messages.generic);
  assert.equal(voteErrorMessage(undefined), messages.generic);
});

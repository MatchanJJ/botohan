import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from "viem";

// Messages from docs/APP_FLOW.md "Error messages".
export const messages = {
  rejected: "You cancelled the transaction. Your vote wasn't sent.",
  AlreadyVoted: "You already voted in this poll.",
  NotAllowed: "This poll is only for wallets registered for the workshop.",
  PollNotOpen: "This poll isn't open right now.",
  InvalidOption: "That option doesn't exist. Refresh and try again.",
  noGas: "You need a little Sepolia ETH to vote. Ask the organizer.",
  generic: "Something went wrong. Try again, or check the transaction on Etherscan.",
} as const;

type RevertName = "AlreadyVoted" | "NotAllowed" | "PollNotOpen" | "InvalidOption";
const revertNames: readonly string[] = ["AlreadyVoted", "NotAllowed", "PollNotOpen", "InvalidOption"];

/** Turn a wallet or contract error from `vote` into a plain message. */
export function voteErrorMessage(error: unknown): string {
  if (!(error instanceof BaseError)) return messages.generic;
  if (error.walk((e) => e instanceof UserRejectedRequestError)) return messages.rejected;
  if (error.walk((e) => e instanceof InsufficientFundsError)) return messages.noGas;

  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  const name = revert instanceof ContractFunctionRevertedError ? revert.data?.errorName : undefined;
  if (name && revertNames.includes(name)) return messages[name as RevertName];
  return messages.generic;
}

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

const voteReverts: Record<string, string> = {
  AlreadyVoted: messages.AlreadyVoted,
  NotAllowed: messages.NotAllowed,
  PollNotOpen: messages.PollNotOpen,
  InvalidOption: messages.InvalidOption,
};

/** Messages for the owner-only admin actions (createPoll, addVoters, closePoll). */
export const adminReverts: Record<string, string> = {
  InvalidTitle: "The title must be 1 to 100 bytes.",
  InvalidOptions: "Use 2 to 10 options, each 1 to 50 bytes.",
  InvalidSchedule: "The end time must be after the start and in the future.",
  TooManyVoters: "Send at most 200 addresses per transaction.",
  PollNotFound: "That poll doesn't exist.",
  OwnableUnauthorizedAccount: "Only the poll owner can do this. Switch to the owner wallet.",
};
export const adminRejected = "You cancelled the transaction. Nothing was sent.";

/** Turn a wallet or contract error into a plain message, using `reverts` for custom errors. */
export function txErrorMessage(error: unknown, reverts: Record<string, string>, rejected: string): string {
  if (!(error instanceof BaseError)) return messages.generic;
  if (error.walk((e) => e instanceof UserRejectedRequestError)) return rejected;
  if (error.walk((e) => e instanceof InsufficientFundsError)) return messages.noGas;

  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  const name = revert instanceof ContractFunctionRevertedError ? revert.data?.errorName : undefined;
  return (name && reverts[name]) || messages.generic;
}

/** Turn a wallet or contract error from `vote` into a plain message (APP_FLOW.md). */
export const voteErrorMessage = (error: unknown) => txErrorMessage(error, voteReverts, messages.rejected);

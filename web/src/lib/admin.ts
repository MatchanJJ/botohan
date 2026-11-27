import { getAddress, isAddress, type Address } from "viem";

// Same limits as Botohan.sol (BACKEND_SCHEMA.md).
export const LIMITS = { titleBytes: 100, optionBytes: 50, minOptions: 2, maxOptions: 10, votersPerCall: 200 };

/** Solidity counts bytes, not characters: "ñ" is 2 bytes. */
export const byteLength = (s: string) => new TextEncoder().encode(s).length;

export type PollDraft = { title: string; options: string[]; startsAt: number; endsAt: number };

/** Problems that would make createPoll revert, in plain words. Empty array = OK to send. */
export function validatePoll(draft: PollDraft, now: number): string[] {
  const errors: string[] = [];
  const title = byteLength(draft.title.trim());
  if (title === 0) errors.push("Add a title.");
  else if (title > LIMITS.titleBytes) errors.push(`The title is ${title} bytes; the limit is ${LIMITS.titleBytes}.`);

  const options = draft.options.map((o) => o.trim());
  if (options.length < LIMITS.minOptions || options.length > LIMITS.maxOptions) {
    errors.push(`Use ${LIMITS.minOptions} to ${LIMITS.maxOptions} options.`);
  }
  options.forEach((o, i) => {
    const n = byteLength(o);
    if (n === 0) errors.push(`Option ${i + 1} is empty.`);
    else if (n > LIMITS.optionBytes) errors.push(`Option ${i + 1} is ${n} bytes; the limit is ${LIMITS.optionBytes}.`);
  });

  if (!Number.isFinite(draft.startsAt) || !Number.isFinite(draft.endsAt)) errors.push("Pick a valid start and duration.");
  else if (draft.endsAt <= draft.startsAt) errors.push("The poll must end after it starts.");
  else if (draft.endsAt <= now) errors.push("The end time is already in the past.");
  return errors;
}

export type VoterList = { valid: Address[]; invalid: string[]; duplicates: number };

/**
 * Addresses pasted one per line, or as a CSV column/row from the registration sheet.
 * Splits on newlines, commas, semicolons, tabs and spaces; strips quotes; dedupes case-insensitively.
 */
export function parseVoters(text: string): VoterList {
  const valid: Address[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  for (const raw of text.split(/[\s,;]+/)) {
    const token = raw.replace(/^["']+|["']+$/g, "");
    if (!token) continue;
    if (!isAddress(token)) {
      invalid.push(token);
      continue;
    }
    const address = getAddress(token);
    if (seen.has(address)) duplicates++;
    else {
      seen.add(address);
      valid.push(address);
    }
  }
  return { valid, invalid, duplicates };
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

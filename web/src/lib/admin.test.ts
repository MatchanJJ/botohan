import assert from "node:assert/strict";
import { test } from "node:test";
import { byteLength, chunk, parseVoters, validatePoll } from "./admin.ts";

const now = 1_800_000_000;
const ok = { title: "Best chain?", options: ["Ethereum", "Solana"], startsAt: now, endsAt: now + 600 };

test("a valid draft has no errors", () => {
  assert.deepEqual(validatePoll(ok, now), []);
});

test("title and options are limited in bytes, like the contract", () => {
  assert.equal(byteLength("ñ"), 2);
  assert.deepEqual(validatePoll({ ...ok, title: "ñ".repeat(50) }, now), []);
  assert.match(validatePoll({ ...ok, title: "ñ".repeat(51) }, now)[0], /102 bytes/);
  assert.deepEqual(validatePoll({ ...ok, title: "   " }, now), ["Add a title."]);
  assert.match(validatePoll({ ...ok, options: ["a".repeat(51), "b"] }, now)[0], /Option 1 is 51 bytes/);
  assert.deepEqual(validatePoll({ ...ok, options: ["a", " "] }, now), ["Option 2 is empty."]);
});

test("option count must be 2 to 10", () => {
  assert.deepEqual(validatePoll({ ...ok, options: ["only"] }, now), ["Use 2 to 10 options."]);
  assert.deepEqual(validatePoll({ ...ok, options: Array.from({ length: 10 }, (_, i) => `o${i}`) }, now), []);
  assert.deepEqual(validatePoll({ ...ok, options: Array.from({ length: 11 }, (_, i) => `o${i}`) }, now), [
    "Use 2 to 10 options.",
  ]);
});

test("schedule must end after start and in the future", () => {
  assert.deepEqual(validatePoll({ ...ok, endsAt: ok.startsAt }, now), ["The poll must end after it starts."]);
  assert.deepEqual(validatePoll({ ...ok, startsAt: now - 900, endsAt: now - 300 }, now), [
    "The end time is already in the past.",
  ]);
  assert.deepEqual(validatePoll({ ...ok, startsAt: NaN }, now), ["Pick a valid start and duration."]);
});

test("parses a pasted sheet column: header, quotes, mixed case, duplicates", () => {
  const a = "0x1c41e1d2Bb16B9EB62e469bFB6f1996D32e19A3C";
  const b = "0x901fb78eC268f1c92a8a4D8a7f63bB43B6d3BD27";
  const text = `Wallet address\n"${a}"\n${a.toLowerCase()}\n${b}, not-an-address\n\n`;
  const list = parseVoters(text);
  assert.deepEqual(list.valid, [a, b]);
  assert.deepEqual(list.invalid, ["Wallet", "address", "not-an-address"]);
  assert.equal(list.duplicates, 1);
});

test("rejects a mixed-case address with a bad checksum", () => {
  assert.deepEqual(parseVoters("0x1C41e1d2Bb16B9EB62e469bFB6f1996D32e19A3C").valid, []);
});

test("chunks into batches of 200", () => {
  assert.deepEqual(chunk(Array.from({ length: 450 }, (_, i) => i), 200).map((c) => c.length), [200, 200, 50]);
  assert.deepEqual(chunk([], 200), []);
});

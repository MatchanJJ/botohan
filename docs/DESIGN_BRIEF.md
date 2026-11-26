# Design Brief: Botohan

## Context

Shown on a classroom projector during the workshop and used by students on laptops and phones.
It should look like it belongs with the workshop slides: same palette, same fonts, same rule
about color.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#FFFFFF` | Background |
| `ink` | `#000000` | Text, rules, results bars, code blocks |
| `grey` | `#5E5E5E` | Secondary text |
| `soft` | `#D9D9D9` | Dividers, empty bar track |
| `eth` | `#627EEA` | **Only** for things you can click or type in: buttons, inputs, selected option, links |
| `ok` | `#11804A` | Confirmed vote, success |
| `bad` | `#CC1F36` | Errors, reverted transactions |

Rule: purple means interactive. Results bars are black, not purple. The leading option's bar is
black; the others are `#BDBDBD`.

## Type

Load with `next/font/google`:

- **Archivo Black**: page titles, poll titles, big numbers in present mode
- **Fira Sans** (400, 600): body and UI
- **Anonymous Pro** (400, 700): addresses, tx hashes, block numbers

Scale (px): 14 / 16 / 20 / 28 / 44 / 72 (present mode titles up to 96). Sentence case everywhere
except poll titles, which keep the creator's casing.

## Layout

- Left-aligned, max content width 880px; present mode is full width.
- Open layout separated by 3px black top rules, not boxed cards. No drop shadows, no gradients.
- Border radius 4–6px on buttons and inputs only.
- Vote options: full-width rows with a radio circle, 56px tall, purple outline when selected.
- Mobile first: everything usable at 360px wide.

## Avoid

- All-caps labels above headings, emoji icons, ✓/✗ glyphs (use words: "Voted", "Closed").
- Animations except: new feed rows highlight for 1.5 s, results bars ease to new width (respect
  `prefers-reduced-motion`).
- Generic Web3 look: neon gradients, glassmorphism, dark mode by default.

## Present mode sketch

```
┌──────────────────────────────────────────────────────────────┐
│ What should Davao DeFi Community build next?        [QR]     │
│ Open · closes in 12:04 · 37 votes               botohan.app/p/0│
│                                                              │
│ Campus event tickets as NFTs     ████████████████  16  43%   │
│ Org treasury with on-chain vote  ████████          9   24%   │
│ Attendance badges                ██████            7   19%   │
│ Student marketplace              ████              5   14%   │
│ ──────────────────────────────────────────────────────────── │
│ 0x1c4…9A3C voted · 4s ago · tx 0x8f2e…                        │
│ 0x77a…01BE voted · 19s ago · tx 0x13cd…                       │
└──────────────────────────────────────────────────────────────┘
```

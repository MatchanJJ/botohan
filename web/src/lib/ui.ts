// Purple (eth) only on things you can click or type in (DESIGN_BRIEF.md).
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eth";
const button = `h-10 rounded-[6px] px-4 font-semibold transition-colors disabled:opacity-60 ${focus}`;

export const primaryButton = `${button} bg-eth text-paper hover:bg-eth/90 disabled:hover:bg-eth`;
export const secondaryButton = `${button} border border-eth text-eth hover:bg-eth/10`;
export const link = `text-eth underline hover:no-underline ${focus}`;
export const input = `h-10 w-full rounded-[4px] border border-eth bg-paper px-3 ${focus}`;
export const label = "mb-1 block font-semibold";

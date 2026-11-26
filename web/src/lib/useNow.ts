import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

/** Current unix time in seconds, ticking every second. 0 during server render. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
}

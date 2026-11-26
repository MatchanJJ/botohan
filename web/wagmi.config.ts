import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

// shortcut: ABI only; add `deployments: { Botohan: { 11155111: "0x…" } }` once Phase 2 deploys.
export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    foundry({
      project: "../contracts",
      include: ["Botohan.sol/**"],
    }),
  ],
});

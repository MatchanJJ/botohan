import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";
import { sepolia } from "wagmi/chains";
import deployment from "../contracts/deployments/sepolia.json";

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    foundry({
      project: "../contracts",
      include: ["Botohan.sol/**"],
      deployments: {
        Botohan: { [sepolia.id]: deployment.Botohan as `0x${string}` },
      },
    }),
  ],
});

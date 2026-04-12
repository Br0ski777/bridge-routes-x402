import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "bridge-routes",
  slug: "bridge-routes",
  description: "Best cross-chain bridge routes aggregated from LI.FI.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/route",
      price: "$0.003",
      description: "Find the best cross-chain bridge route",
      toolName: "bridge_find_best_route",
      toolDescription: "Use this when you need to bridge tokens cross-chain. Returns ranked routes with fee, time, and bridge provider across 60+ chains and 18+ bridges. Powered by LI.FI. Do NOT use for same-chain swaps — use dex_get_swap_quote. Do NOT use for gas prices — use gas_get_current_price.",
      inputSchema: {
        type: "object",
        properties: {
          fromChain: {
            type: "string",
            description: "Source chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche)",
          },
          toChain: {
            type: "string",
            description: "Destination chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche)",
          },
          token: {
            type: "string",
            description: "Token symbol to bridge (e.g. USDC, USDT, ETH, WETH)",
          },
          amount: {
            type: "string",
            description: "Amount in smallest unit (e.g. 1000000 for 1 USDC with 6 decimals, 1000000000000000000 for 1 ETH)",
          },
          toToken: {
            type: "string",
            description: "Destination token symbol if different from source (optional, defaults to same as token)",
          },
        },
        required: ["fromChain", "toChain", "token", "amount"],
      },
    },
  ],
};

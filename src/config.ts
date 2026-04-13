import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "bridge-routes",
  slug: "bridge-routes",
  description: "Best cross-chain bridge routes via LI.FI -- 60+ chains, 18+ bridges, fees and time compared.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/route",
      price: "$0.003",
      description: "Find the best cross-chain bridge route",
      toolName: "bridge_find_best_route",
      toolDescription: `Use this when you need to bridge tokens between different blockchains. Returns ranked bridge routes with fees and timing in JSON.

1. routes: array of bridge options ranked by best value
2. bridgeProvider: which bridge protocol (Stargate, Across, Hop, Connext, etc.)
3. estimatedTime: expected bridge completion time in seconds
4. fee: total bridging fee in USD
5. amountReceived: expected output amount on destination chain
6. steps: detailed step-by-step route (approve, bridge, swap if needed)

Example output: {"routes":[{"bridgeProvider":"Stargate","estimatedTime":60,"fee":0.85,"amountReceived":"999.15","steps":["approve USDC","bridge via Stargate"]}],"fromChain":"Ethereum","toChain":"Base","token":"USDC"}

Use this BEFORE moving assets cross-chain to find the cheapest and fastest bridge. Essential for multi-chain portfolio management.

Do NOT use for same-chain swaps -- use dex_get_swap_quote instead. Do NOT use for gas prices -- use gas_get_current_price instead. Do NOT use for multi-chain gas comparison -- use crypto_estimate_gas instead.`,
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
      outputSchema: {
          "type": "object",
          "properties": {
            "from_chain": {
              "type": "string",
              "description": "Source chain name"
            },
            "to_chain": {
              "type": "string",
              "description": "Destination chain name"
            },
            "token": {
              "type": "string",
              "description": "Token symbol"
            },
            "amount": {
              "type": "string",
              "description": "Amount to bridge"
            },
            "results": {
              "type": "number",
              "description": "Number of bridge routes found"
            },
            "routes": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "bridge": {
                    "type": "string"
                  },
                  "estimatedOutput": {
                    "type": "string"
                  },
                  "estimatedFee": {
                    "type": "string"
                  },
                  "estimatedTime": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "required": [
            "from_chain",
            "to_chain",
            "token",
            "results"
          ]
        },
    },
  ],
};

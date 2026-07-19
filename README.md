# Cross-Chain Bridge Route API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://bridge-routes.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Best cross-chain bridge routes via LI.FI -- 60+ chains, 18+ bridges, fees and time compared. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "bridge-routes": {
      "url": "https://bridge-routes.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl "https://bridge-routes.api.klymax402.com/api/route?fromChain=...&toChain=...&token=...&amount=..."
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `bridge_find_best_route` | GET | `/api/route` | $0.008 | Find the best cross-chain bridge route |
| `bridge_find_best_route` | POST | `/api/route` | $0.008 | Find the best cross-chain bridge route (POST variant) |

### `bridge_find_best_route`

Use this when you need to bridge tokens between different blockchains. Returns ranked bridge routes with fees and timing in JSON.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `fromChain` | string | yes | Source chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche) |
| `toChain` | string | yes | Destination chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche) |
| `token` | string | yes | Token symbol to bridge (e.g. USDC, USDT, ETH, WETH) |
| `amount` | string | yes | Amount in smallest unit (e.g. 1000000 for 1 USDC with 6 decimals, 1000000000000000000 for 1 ETH) |
| `toToken` | string | no | Destination token symbol if different from source (optional, defaults to same as token) |

**Returns**

- `routes` -- array of bridge options ranked by best value
- `bridgeProvider` -- which bridge protocol (Stargate, Across, Hop, Connext, etc.)
- `estimatedTime` -- expected bridge completion time in seconds
- `fee` -- total bridging fee in USD
- `amountReceived` -- expected output amount on destination chain
- `steps` -- detailed step-by-step route (approve, bridge, swap if needed)

Example response:

```json
{"routes":[{"bridgeProvider":"Stargate","estimatedTime":60,"fee":0.85,"amountReceived":"999.15","steps":["approve USDC","bridge via Stargate"]}],"fromChain":"Ethereum","toChain":"Base","token":"USDC"}
```

**When to use**: moving assets cross-chain to find the cheapest and fastest bridge. Essential for multi-chain portfolio management.

**Not for**: gas prices (use `gas_get_current_price`).

### `bridge_find_best_route`

Use this when you need to bridge tokens between different blockchains. Returns ranked bridge routes with fees and timing in JSON. POST variant of bridge_find_best_route -- same params passed as JSON body instead of query string.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `fromChain` | string | yes | Source chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche) |
| `toChain` | string | yes | Destination chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche) |
| `token` | string | yes | Token symbol to bridge (e.g. USDC, USDT, ETH, WETH) |
| `amount` | string | yes | Amount in smallest unit (e.g. 1000000 for 1 USDC with 6 decimals, 1000000000000000000 for 1 ETH) |
| `toToken` | string | no | Destination token symbol if different from source (optional, defaults to same as token) |

**Returns**

- `routes` -- array of bridge options ranked by best value
- `bridgeProvider` -- which bridge protocol (Stargate, Across, Hop, Connext, etc.)
- `estimatedTime` -- expected bridge completion time in seconds
- `fee` -- total bridging fee in USD
- `amountReceived` -- expected output amount on destination chain
- `steps` -- detailed step-by-step route (approve, bridge, swap if needed)

Example response:

```json
{"routes":[{"bridgeProvider":"Stargate","estimatedTime":60,"fee":0.85,"amountReceived":"999.15","steps":["approve USDC","bridge via Stargate"]}],"fromChain":"Ethereum","toChain":"Base","token":"USDC"}
```

**When to use**: moving assets cross-chain to find the cheapest and fastest bridge. Essential for multi-chain portfolio management.

**Not for**: gas prices (use `gas_get_current_price`).

## Example agent prompts

- "Bridge tokens between different blockchains"
- "Bridge tokens between different blockchains"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT

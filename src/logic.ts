import type { Hono } from "hono";

// In-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Chain ID to name mapping
const CHAIN_NAMES: Record<string, string> = {
  "1": "Ethereum",
  "8453": "Base",
  "42161": "Arbitrum",
  "10": "Optimism",
  "137": "Polygon",
  "56": "BSC",
  "43114": "Avalanche",
  "250": "Fantom",
  "100": "Gnosis",
  "324": "zkSync Era",
  "59144": "Linea",
  "534352": "Scroll",
  "5000": "Mantle",
  "1101": "Polygon zkEVM",
};

// Token symbol to contract address per chain
// Using well-known addresses; native tokens use 0x0 convention
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  USDC: {
    "1": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "42161": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "10": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "137": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "56": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    "43114": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  USDT: {
    "1": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "8453": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    "42161": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    "10": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    "137": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    "56": "0x55d398326f99059fF775485246999027B3197955",
    "43114": "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  },
  ETH: {
    "1": "0x0000000000000000000000000000000000000000",
    "8453": "0x0000000000000000000000000000000000000000",
    "42161": "0x0000000000000000000000000000000000000000",
    "10": "0x0000000000000000000000000000000000000000",
  },
  WETH: {
    "1": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "8453": "0x4200000000000000000000000000000000000006",
    "42161": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    "10": "0x4200000000000000000000000000000000000006",
    "137": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  },
};

function resolveTokenAddress(symbol: string, chainId: string): string | null {
  const upper = symbol.toUpperCase();
  return TOKEN_ADDRESSES[upper]?.[chainId] || null;
}

interface LiFiRoute {
  bridge: string;
  estimated_time_seconds: number;
  fee_usd: number;
  gas_cost_usd: number;
  slippage_percent: number;
  total_cost_usd: number;
  amount_received: string;
  amount_received_usd: number;
  steps: Array<{
    type: string;
    tool: string;
    from_chain: string;
    to_chain: string;
    from_token: string;
    to_token: string;
  }>;
}

async function fetchLiFiQuote(
  fromChain: string,
  toChain: string,
  fromToken: string,
  toToken: string,
  fromAmount: string
): Promise<any> {
  const cacheKey = `lifi_${fromChain}_${toChain}_${fromToken}_${toToken}_${fromAmount}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  // Use the LI.FI quote endpoint
  const params = new URLSearchParams({
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    // Use a generic address for quote (no wallet needed)
    fromAddress: "0x0000000000000000000000000000000000000000",
  });

  const resp = await fetch(`https://li.quest/v1/quote?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LI.FI API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  setCache(cacheKey, data);
  return data;
}

async function fetchLiFiConnections(fromChain: string, toChain: string): Promise<any> {
  const cacheKey = `lifi_connections_${fromChain}_${toChain}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ fromChain, toChain });
  const resp = await fetch(`https://li.quest/v1/connections?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!resp.ok) return null;

  const data = await resp.json();
  setCache(cacheKey, data);
  return data;
}

function parseQuoteToRoute(quote: any): LiFiRoute | null {
  if (!quote || !quote.estimate) return null;

  const estimate = quote.estimate;
  const action = quote.action || {};
  const toolDetails = quote.toolDetails || {};

  // Extract fee info
  const gasCosts = estimate.gasCosts || [];
  const feeCosts = estimate.feeCosts || [];

  const gasUsd = gasCosts.reduce((sum: number, g: any) => sum + parseFloat(g.amountUSD || "0"), 0);
  const feeUsd = feeCosts.reduce((sum: number, f: any) => sum + parseFloat(f.amountUSD || "0"), 0);
  const totalCost = gasUsd + feeUsd;

  // Extract steps
  const includedSteps = quote.includedSteps || [];
  const steps = includedSteps.map((step: any) => ({
    type: step.type || "unknown",
    tool: step.toolDetails?.name || step.tool || "unknown",
    from_chain: CHAIN_NAMES[String(step.action?.fromChainId)] || String(step.action?.fromChainId || ""),
    to_chain: CHAIN_NAMES[String(step.action?.toChainId)] || String(step.action?.toChainId || ""),
    from_token: step.action?.fromToken?.symbol || "",
    to_token: step.action?.toToken?.symbol || "",
  }));

  return {
    bridge: toolDetails.name || quote.tool || "Unknown",
    estimated_time_seconds: estimate.executionDuration || 0,
    fee_usd: parseFloat(feeUsd.toFixed(4)),
    gas_cost_usd: parseFloat(gasUsd.toFixed(4)),
    slippage_percent: action.slippage ? parseFloat((action.slippage * 100).toFixed(2)) : 0.5,
    total_cost_usd: parseFloat(totalCost.toFixed(4)),
    amount_received: estimate.toAmount || "0",
    amount_received_usd: parseFloat(parseFloat(estimate.toAmountUSD || "0").toFixed(2)),
    steps: steps.length > 0 ? steps : [{
      type: "bridge",
      tool: toolDetails.name || quote.tool || "unknown",
      from_chain: CHAIN_NAMES[String(action.fromChainId)] || String(action.fromChainId || ""),
      to_chain: CHAIN_NAMES[String(action.toChainId)] || String(action.toChainId || ""),
      from_token: action.fromToken?.symbol || "",
      to_token: action.toToken?.symbol || "",
    }],
  };
}

export function registerRoutes(app: Hono) {
  app.get("/api/route", async (c) => {
    const fromChain = c.req.query("fromChain");
    const toChain = c.req.query("toChain");
    const tokenSymbol = c.req.query("token");
    const amount = c.req.query("amount");
    const toTokenSymbol = c.req.query("toToken");

    if (!fromChain || !toChain || !tokenSymbol || !amount) {
      return c.json({
        error: "Missing required parameters",
        required: "fromChain, toChain, token, amount",
        example: "/api/route?fromChain=8453&toChain=1&token=USDC&amount=1000000",
        chain_ids: CHAIN_NAMES,
      }, 400);
    }

    // Resolve token addresses
    const fromTokenAddr = resolveTokenAddress(tokenSymbol, fromChain);
    const destSymbol = toTokenSymbol || tokenSymbol;
    const toTokenAddr = resolveTokenAddress(destSymbol, toChain);

    if (!fromTokenAddr) {
      return c.json({
        error: `Token ${tokenSymbol} not found on chain ${CHAIN_NAMES[fromChain] || fromChain}`,
        supported_tokens: Object.keys(TOKEN_ADDRESSES),
        supported_chains: CHAIN_NAMES,
      }, 400);
    }

    if (!toTokenAddr) {
      return c.json({
        error: `Token ${destSymbol} not found on chain ${CHAIN_NAMES[toChain] || toChain}`,
        supported_tokens: Object.keys(TOKEN_ADDRESSES),
        supported_chains: CHAIN_NAMES,
      }, 400);
    }

    // Fetch quote from LI.FI
    let routes: LiFiRoute[] = [];

    try {
      const quote = await fetchLiFiQuote(fromChain, toChain, fromTokenAddr, toTokenAddr, amount);
      const route = parseQuoteToRoute(quote);
      if (route) routes.push(route);
    } catch (err: any) {
      // If single quote fails, try with connections info for context
      const connections = await fetchLiFiConnections(fromChain, toChain).catch(() => null);
      if (!connections) {
        return c.json({
          error: "Failed to fetch bridge routes",
          details: err.message,
          hint: "Check that the token is available on both chains and the amount is valid.",
        }, 502);
      }
    }

    // Also try with alternative token addresses (e.g. ETH vs WETH)
    if (routes.length === 0) {
      // Try native ETH if WETH was requested, or vice versa
      const altSymbol = tokenSymbol.toUpperCase() === "ETH" ? "WETH" : tokenSymbol.toUpperCase() === "WETH" ? "ETH" : null;
      if (altSymbol) {
        const altFrom = resolveTokenAddress(altSymbol, fromChain);
        const altTo = resolveTokenAddress(toTokenSymbol ? destSymbol : altSymbol, toChain);
        if (altFrom && altTo) {
          try {
            const quote = await fetchLiFiQuote(fromChain, toChain, altFrom, altTo, amount);
            const route = parseQuoteToRoute(quote);
            if (route) routes.push(route);
          } catch (_) {
            // Ignore alt attempt failure
          }
        }
      }
    }

    if (routes.length === 0) {
      return c.json({
        from_chain: CHAIN_NAMES[fromChain] || fromChain,
        to_chain: CHAIN_NAMES[toChain] || toChain,
        token: tokenSymbol,
        to_token: destSymbol,
        amount,
        results: 0,
        routes: [],
        message: `No bridge routes found for ${tokenSymbol} from ${CHAIN_NAMES[fromChain] || fromChain} to ${CHAIN_NAMES[toChain] || toChain}. Try a different token or chain pair.`,
      });
    }

    // Sort by total cost ascending (cheapest first)
    routes.sort((a, b) => a.total_cost_usd - b.total_cost_usd);

    // Return top 3
    const topRoutes = routes.slice(0, 3);

    return c.json({
      from_chain: CHAIN_NAMES[fromChain] || fromChain,
      from_chain_id: parseInt(fromChain),
      to_chain: CHAIN_NAMES[toChain] || toChain,
      to_chain_id: parseInt(toChain),
      token: tokenSymbol.toUpperCase(),
      to_token: destSymbol.toUpperCase(),
      amount,
      results: topRoutes.length,
      cached_until: new Date(Date.now() + CACHE_TTL).toISOString(),
      routes: topRoutes.map((r, i) => ({
        rank: i + 1,
        ...r,
        estimated_time_formatted: r.estimated_time_seconds < 60
          ? `${r.estimated_time_seconds}s`
          : `${Math.round(r.estimated_time_seconds / 60)}m`,
      })),
    });
  });
}

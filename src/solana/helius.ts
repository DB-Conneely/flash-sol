// src/solana/helius.ts
// --- IMPORTS ---
import { PublicKey } from '@solana/web3.js';
import connection from '../solana/client';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { logError, logDebug } from '../utils/logger';

// --- INTERFACES ---
// Defines the structure for token assets in the portfolio
export interface TokenAsset {
  name: string;
  symbol: string;
  balance: number;
  address: string;
}

// --- PRIVATE FUNCTIONS ---
// Retrieves the Helius RPC URL from environment variables
function getHeliusRpcUrl(): string {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) {
    throw new Error('SOLANA_RPC_URL (Helius RPC) not set in .env');
  }
  return url;
}

// --- EXPORTED FUNCTIONS ---
/**
 * Fetches the portfolio of fungible SPL tokens using an efficient, chunked batch method.
 * @param ownerAddress The public key of the wallet to query.
 * @returns A promise that resolves to an array of TokenAsset objects.
 */
export async function getParsedPortfolio(ownerAddress: string): Promise<TokenAsset[]> {
  const ownerPublicKey = new PublicKey(ownerAddress);

  // Fetch all token accounts to identify held tokens with positive balances
  logDebug(`[PortfolioV3] Fetching token accounts for ${ownerAddress}`);
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  const mintsWithBalances = new Map<string, number>();
  for (const account of tokenAccounts.value) {
    const tokenInfo = account.account.data.parsed.info;
    const balance = tokenInfo.tokenAmount.uiAmount;
    if (balance > 0) {
      mintsWithBalances.set(tokenInfo.mint, balance);
    }
  }

  const mintAddresses = Array.from(mintsWithBalances.keys());
  if (mintAddresses.length === 0) {
    return [];
  }

  // Fetch metadata in chunks of 100 to comply with API limits
  logDebug(`[PortfolioV3] Found ${mintAddresses.length} unique mints. Fetching metadata in chunks...`);
  const heliusRpcUrl = getHeliusRpcUrl();
  const allAssets = [];
  const chunkSize = 100;

  for (let i = 0; i < mintAddresses.length; i += chunkSize) {
    const chunk = mintAddresses.slice(i, i + chunkSize);
    try {
      const { data } = await axios.post(heliusRpcUrl, {
        jsonrpc: '2.0',
        id: `flashsol-chunk-${i}`,
        method: 'getAssetBatch',
        params: { ids: chunk },
      });
      if (data.result) {
        allAssets.push(...data.result);
      }
    } catch (error) {
      logError(null, `[PortfolioV3] A chunk failed to load`, { error });
    }
  }

  // Filter results to fungible tokens and format into TokenAsset objects
  const portfolio: TokenAsset[] = allAssets
    .filter(asset => {
      const standard = asset?.content?.metadata?.token_standard;
      return asset && standard && (standard === 'Fungible' || standard === 'FungibleAsset');
    })
    .map((asset): TokenAsset => ({
      address: asset.id,
      name: asset.content.metadata.name,
      symbol: asset.content.metadata.symbol,
      balance: mintsWithBalances.get(asset.id)!,
    }));
      
  logDebug(`[PortfolioV3] Finished parsing. Found ${portfolio.length} fungible tokens.`);
  return portfolio;
}

/**
 * Fetches metadata for a single token mint address, used for tokens not yet owned (e.g., in /buy).
 * @param mintAddress The contract address of the token.
 * @returns An object with name and symbol if found and fungible, otherwise null.
 */
export async function getTokenMetadata(mintAddress: string): Promise<{ name: string, symbol: string } | null> {
  logDebug(`[Metadata] Fetching metadata for mint: ${mintAddress}`);
  const heliusRpcUrl = getHeliusRpcUrl();
  try {
    const { data } = await axios.post(heliusRpcUrl, {
      jsonrpc: '2.0',
      id: `flashsol-meta-${mintAddress}`,
      method: 'getAsset',
      params: { id: mintAddress },
    });

    if (data.result && data.result.content?.metadata) {
      const standard = data.result.content.metadata.token_standard;
      if (standard === 'Fungible' || standard === 'FungibleAsset') {
        return {
          name: data.result.content.metadata.name || 'Unknown Token',
          symbol: data.result.content.metadata.symbol || '???',
        };
      }
    }
    return null;
  } catch (error) {
    logError(null, `[Metadata] Failed to fetch metadata for ${mintAddress}`, { error });
    return null;
  }
}
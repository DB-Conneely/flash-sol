// src/utils/helpers.ts
// --- IMPORTS ---
import { TokenAsset } from '../solana/helius';

// --- HELPER FUNCTIONS ---
/**
 * Finds a token in the portfolio array by matching the address (case-insensitive).
 * @param portfolio An array of TokenAsset objects representing the user's holdings.
 * @param address The mint address (CA) to search for.
 * @returns The matching TokenAsset if found, otherwise undefined.
 */
export function findTokenByAddress(portfolio: TokenAsset[], address: string): TokenAsset | undefined {
  return portfolio.find(token => token.address.toLowerCase() === address.toLowerCase());
}

/**
 * Formats a token's details into an HTML string for display in Telegram messages.
 * @param token The TokenAsset object to format.
 * @returns A formatted HTML string with symbol, balance, and address.
 */
export function formatTokenForDisplay(token: TokenAsset): string {
    const balance = token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return `<b>${token.symbol}</b>: ${balance} (<code>${token.address}</code>)`;
}
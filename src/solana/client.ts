// src/solana/client.ts
// --- IMPORTS ---
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import { logError } from '../utils/logger';

// Load environment variables
dotenv.config();

// --- GLOBAL CONSTANTS ---
// Retrieve Solana RPC URL from environment variables
console.log('All process.env keys:', Object.keys(process.env).sort()); // Lists all env vars for debug
console.log('SOLANA_RPC_URL value:', process.env.SOLANA_RPC_URL || 'UNDEFINED'); // Specific check
const rpcUrl = process.env.SOLANA_RPC_URL;
if (!rpcUrl) {
  throw new Error('SOLANA_RPC_URL not set in .env');
}

// --- INITIALIZATION ---
// Create a Solana connection instance with confirmed commitment level
const connection = new Connection(rpcUrl, 'confirmed');

// --- EXPORTED FUNCTIONS ---
// Retrieves the balance of a Solana wallet in SOL units
export async function getWalletBalance(publicKey: string): Promise<number> {
  try {
    const pubKey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubKey);
    return balance / LAMPORTS_PER_SOL; // Use constant
  } catch (error) {
    logError(null, '[Client] Error fetching wallet balance', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new Error('Invalid public key or RPC error');
  }
}

// Export the connection instance as default
export default connection;
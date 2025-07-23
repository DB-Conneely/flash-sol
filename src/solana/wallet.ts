// src/solana/wallet.ts
// --- IMPORTS ---
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { logDebug, logError } from '../utils/logger';

// --- EXPORTED FUNCTIONS ---
// Generates a new Solana wallet keypair, encodes the secret key in Base58, and validates it
export function generateWallet() {
  logDebug('[Wallet] Generating new wallet');
  const keypair = Keypair.generate();
  const secretKey = bs58.encode(keypair.secretKey);
  try {
    bs58.decode(secretKey); // Validate encoding
  } catch (error) {
    logError(null, '[Wallet] Failed to generate valid Base58 secret key', { error: (error as Error).message });
    throw new Error('Failed to generate valid Base58 secret key');
  }
  logDebug('[Wallet] Wallet generated', { publicKey: keypair.publicKey.toString(), secretKeyLength: secretKey.length });
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey
  };
}
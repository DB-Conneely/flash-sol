//tests/solana.test.ts
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

import { describe, it, expect, jest } from '@jest/globals';
import { LAMPORTS_PER_SOL, Keypair, Connection, PublicKey } from '@solana/web3.js';

jest.mock('bs58', () => ({
  encode: jest.fn(),
  decode: jest.fn(),
}));

jest.mock('../src/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

import { generateWallet } from '../src/solana/wallet';
import { getWalletBalance } from '../src/solana/client';

const { logDebug, logError } = require('../src/utils/logger');
const mockedBs58 = require('bs58');

describe('Solana Core Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateWallet: Generates valid wallet', () => {
    (mockedBs58.encode as jest.Mock).mockReturnValue('mockSecretBase58');
    (mockedBs58.decode as jest.Mock).mockReturnValue(new Uint8Array(64)); // Valid decode

    const wallet = generateWallet();
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.secretKey).toBe('mockSecretBase58');
    expect(logDebug).toHaveBeenCalledWith('[Wallet] Generating new wallet');
    expect(logDebug).toHaveBeenCalledWith(expect.stringContaining('Wallet generated'), expect.any(Object));
  });

  it('generateWallet: Throws on invalid Base58 secret key', () => {
    (mockedBs58.encode as jest.Mock).mockReturnValue('mockInvalidSecret');
    (mockedBs58.decode as jest.Mock).mockImplementation(() => { throw new Error('Invalid Base58'); });

    expect(generateWallet).toThrow('Failed to generate valid Base58 secret key');
    expect(logError).toHaveBeenCalledWith(null, '[Wallet] Failed to generate valid Base58 secret key', expect.any(Object));
  });

  it('getWalletBalance: Returns balance in SOL', async () => {
    jest.spyOn(Connection.prototype, 'getBalance').mockResolvedValue(1000000000); // 1 SOL in lamports
    const balance = await getWalletBalance('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'); // Valid base58 pubkey
    expect(balance).toBe(1000000000 / LAMPORTS_PER_SOL);
    expect(Connection.prototype.getBalance).toHaveBeenCalledWith(expect.any(PublicKey));
  });

  it('getWalletBalance: Throws on invalid key or error', async () => {
    jest.spyOn(Connection.prototype, 'getBalance').mockRejectedValue(new Error('Invalid'));
    await expect(getWalletBalance('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')).rejects.toThrow('Invalid public key or RPC error');
    expect(logError).toHaveBeenCalledWith(null, '[Client] Error fetching wallet balance', expect.any(Object));
  });
});
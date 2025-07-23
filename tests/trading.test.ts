// tests/trading.test.ts

import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
import { buyToken, sellToken } from '../src/solana/trading';
import connection from '../src/solana/client';
import { getParsedPortfolio } from '../src/solana/helius';

// Mock dependencies
jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js');
  return {
    ...actual,
    Keypair: {
      ...actual.Keypair,
      fromSecretKey: jest.fn(),
    },
    VersionedTransaction: {
      ...actual.VersionedTransaction,
      deserialize: jest.fn(),
    },
  };
});
jest.mock('cross-fetch');
jest.mock('../src/solana/client');
jest.mock('../src/solana/helius');
jest.mock('bs58');
jest.mock('../src/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockedConnection = connection as jest.Mocked<typeof connection>;
const mockedGetParsedPortfolio = getParsedPortfolio as jest.Mock;
const mockedBs58 = bs58 as jest.Mocked<typeof bs58>;

describe('Trading Logic', () => {
  const mockSecretKey = 'secretbase58';
  const mockDecodedKey = new Uint8Array(64);
  const mockKeypair = { publicKey: new PublicKey('11111111111111111111111111111111'), secretKey: mockDecodedKey };
  const mockTokenAddress = 'tokenaddr';
  const mockSlippageBps = 500;

  beforeEach(() => {
    mockedBs58.decode.mockReturnValue(mockDecodedKey);
    (Keypair.fromSecretKey as jest.Mock).mockReturnValue(mockKeypair);
    mockedFetch.mockClear();
    mockedConnection.getBalance.mockClear();
    mockedConnection.simulateTransaction.mockClear();
    mockedConnection.sendRawTransaction.mockClear();
    mockedConnection.confirmTransaction.mockClear();
    mockedConnection.getLatestBlockhash.mockClear();
    mockedConnection.getParsedAccountInfo.mockClear();
    mockedGetParsedPortfolio.mockClear();
    (VersionedTransaction.deserialize as jest.Mock).mockReturnValue({
      sign: jest.fn(),
      serialize: jest.fn().mockReturnValue(Buffer.from('serializedtx')),
    });
  });

  test('buyToken - successful buy with fee', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ outAmount: '1000000000' }) } as any);
    mockedFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ swapTransaction: 'c3dhcA==' }) } as any); // base64 'swap'
    mockedConnection.simulateTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: null, logs: [] } });
    mockedConnection.sendRawTransaction.mockResolvedValue('txid');
    mockedConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'hash', lastValidBlockHeight: 100 });
    mockedConnection.confirmTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: null } });
    mockedConnection.getBalance.mockResolvedValue(2000000000); // 2 SOL
    mockedConnection.getParsedAccountInfo.mockResolvedValue({ context: { slot: 123 }, value: { data: { program: 'spl-token', parsed: { info: { decimals: 9 } }, space: 165 }, executable: false, lamports: 0, owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), rentEpoch: 0 } });

    const result = await buyToken(1, mockSecretKey, mockSlippageBps, mockTokenAddress);

    expect(result).toEqual({ txid: 'txid', outAmount: '1000000000' });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedConnection.sendRawTransaction).toHaveBeenCalledWith(expect.any(Buffer), { skipPreflight: true });
    expect(mockedConnection.confirmTransaction).toHaveBeenCalled();
  });

  test('buyToken - insufficient balance for fee', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ outAmount: '100' }) } as any);
    mockedFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ swapTransaction: 'c3dhcA==' }) } as any);
    mockedConnection.simulateTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: null, logs: [] } });
    mockedConnection.sendRawTransaction.mockResolvedValue('txid');
    mockedConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'hash', lastValidBlockHeight: 100 });
    mockedConnection.confirmTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: null } });
    mockedConnection.getBalance.mockResolvedValue(5000000); // Below rent + fee
    mockedConnection.getParsedAccountInfo.mockResolvedValue({ context: { slot: 123 }, value: { data: { program: 'spl-token', parsed: { info: { decimals: 9 } }, space: 165 }, executable: false, lamports: 0, owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), rentEpoch: 0 } });

    const result = await buyToken(1, mockSecretKey, mockSlippageBps, mockTokenAddress);

    expect(result.txid).toBe('txid');
    // Fee send skipped due to low balance, but trade succeeds
  });

  test('buyToken - quote failure', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: false, statusText: 'Bad Request' } as any);

    await expect(buyToken(1, mockSecretKey, mockSlippageBps, mockTokenAddress)).rejects.toThrow('Failed to fetch quote from Jupiter API');
  });

  test('sellToken - successful sell with fee', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ outAmount: '995000000' }) } as any); // After fee
    mockedFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ swapTransaction: 'c3dhcA==' }) } as any);
    mockedConnection.simulateTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: null, logs: [] } });
    mockedConnection.sendRawTransaction.mockResolvedValue('txid');
    mockedConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'hash', lastValidBlockHeight: 100 });
    mockedConnection.confirmTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: null } });
    mockedConnection.getBalance.mockResolvedValue(2000000000);
    mockedConnection.getParsedAccountInfo.mockResolvedValue({ context: { slot: 123 }, value: { data: { program: 'spl-token', parsed: { info: { decimals: 9 } }, space: 165 }, executable: false, lamports: 0, owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), rentEpoch: 0 } });

    const result = await sellToken(100000000000, mockSecretKey, mockSlippageBps, mockTokenAddress); // 100 tokens @ 9 decimals

    expect(result).toEqual({ txid: 'txid', outAmount: '995000000' });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  test('sellToken - simulation failure', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) } as any);
    mockedFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ swapTransaction: 'c3dhcA==' }) } as any);
    mockedConnection.simulateTransaction.mockResolvedValue({ context: { slot: 123 }, value: { err: 'SimError', logs: [] } });
    mockedConnection.getParsedAccountInfo.mockResolvedValue({ context: { slot: 123 }, value: { data: { program: 'spl-token', parsed: { info: { decimals: 9 } }, space: 165 }, executable: false, lamports: 0, owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), rentEpoch: 0 } });

    await expect(sellToken(100, mockSecretKey, mockSlippageBps, mockTokenAddress)).rejects.toThrow('Transaction simulation failed');
  });
});
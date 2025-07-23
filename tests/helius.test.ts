// tests/helius.test.ts
import axios from 'axios';
import { PublicKey } from '@solana/web3.js';
import { getParsedPortfolio, getTokenMetadata } from '../src/solana/helius';
import connection from '../src/solana/client';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as loggerModule from '../src/utils/logger'; // Import entire module for spying

// Mock axios for Helius API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Solana connection for token accounts
jest.mock('../src/solana/client', () => ({
  __esModule: true,
  default: {
    getParsedTokenAccountsByOwner: jest.fn(),
    getParsedAccountInfo: jest.fn(),
  },
}));

describe('Helius Utilities', () => {
  const mockOwner = 'So11111111111111111111111111111111111111112'; // Valid base58 Solana pubkey (SOL mint)

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on logger functions instead of mocking as Mock
    jest.spyOn(loggerModule, 'logDebug').mockImplementation(() => {});
    jest.spyOn(loggerModule, 'logError').mockImplementation(() => {});
  });

  it('should fetch and parse portfolio with fungible tokens', async () => {
    // Mock token accounts
    (connection.getParsedTokenAccountsByOwner as jest.Mock).mockResolvedValue({
      value: [
        { account: { data: { parsed: { info: { mint: 'mint1', tokenAmount: { uiAmount: 100 } } } } } },
        { account: { data: { parsed: { info: { mint: 'mint2', tokenAmount: { uiAmount: 0 } } } } } }, // Zero balance skipped
      ],
    });

    // Mock Helius getAssetBatch
    mockedAxios.post.mockResolvedValue({
      data: {
        result: [
          { id: 'mint1', content: { metadata: { name: 'Token1', symbol: 'T1', token_standard: 'Fungible' } } },
          { id: 'mint3', content: { metadata: { token_standard: 'NFT' } } }, // Non-fungible filtered out
        ],
      },
    });

    const portfolio = await getParsedPortfolio(mockOwner);
    expect(portfolio).toHaveLength(1);
    expect(portfolio[0]).toEqual({ address: 'mint1', name: 'Token1', symbol: 'T1', balance: 100 });
    expect(connection.getParsedTokenAccountsByOwner).toHaveBeenCalledWith(new PublicKey(mockOwner), { programId: TOKEN_PROGRAM_ID });
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'getAssetBatch' }));
  });

  it('should return empty portfolio if no tokens', async () => {
    (connection.getParsedTokenAccountsByOwner as jest.Mock).mockResolvedValue({ value: [] });
    const portfolio = await getParsedPortfolio(mockOwner);
    expect(portfolio).toEqual([]);
  });

  it('should fetch single token metadata', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        result: { content: { metadata: { name: 'SingleToken', symbol: 'ST', token_standard: 'Fungible' } } },
      },
    });

    const metadata = await getTokenMetadata('singleMint');
    expect(metadata).toEqual({ name: 'SingleToken', symbol: 'ST' });
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'getAsset' }));
  });

  it('should return null for invalid or non-fungible token metadata', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { result: { content: { metadata: { token_standard: 'NFT' } } } }, // Non-fungible
    });
    let metadata = await getTokenMetadata('nftMint');
    expect(metadata).toBeNull();

    mockedAxios.post.mockResolvedValue({ data: { result: null } }); // Not found
    metadata = await getTokenMetadata('missingMint');
    expect(metadata).toBeNull();
  });

  it('should handle API errors in portfolio fetching', async () => {
    (connection.getParsedTokenAccountsByOwner as jest.Mock).mockResolvedValue({
      value: [{ account: { data: { parsed: { info: { mint: 'mint1', tokenAmount: { uiAmount: 100 } } } } } }],
    });
    mockedAxios.post.mockRejectedValue(new Error('API fail'));
    const portfolio = await getParsedPortfolio(mockOwner);
    expect(portfolio).toEqual([]); // Changed to direct await/assert since it resolves
    expect(loggerModule.logError).toHaveBeenCalledWith(null, '[PortfolioV3] A chunk failed to load', expect.any(Object));
  });

  it('should handle metadata API errors', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Metadata fail'));
    const metadata = await getTokenMetadata('errorMint');
    expect(metadata).toBeNull();
    expect(loggerModule.logError).toHaveBeenCalledWith(null, expect.stringContaining('Failed to fetch metadata'), expect.any(Object));
  });
});
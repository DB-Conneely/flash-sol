// tests/helpers.test.ts
import { findTokenByAddress, formatTokenForDisplay } from '../src/utils/helpers';
import { TokenAsset } from '../src/solana/helius';

describe('Helpers Utils', () => {
  const mockPortfolio: TokenAsset[] = [
    { address: 'addr1', name: 'Test1', symbol: 'T1', balance: 1.2345 },
    { address: 'ADDR2', name: 'Test2', symbol: 'T2', balance: 2 },
  ];

  test('findTokenByAddress: Finds token case-insensitively', () => {
    const token = findTokenByAddress(mockPortfolio, 'addr1');
    expect(token).toEqual(mockPortfolio[0]);
    const tokenUpper = findTokenByAddress(mockPortfolio, 'addr2');
    expect(tokenUpper).toEqual(mockPortfolio[1]);
    const missing = findTokenByAddress(mockPortfolio, 'missing');
    expect(missing).toBeUndefined();
  });

  test('formatTokenForDisplay: Formats correctly', () => {
    const formatted = formatTokenForDisplay(mockPortfolio[0]);
    expect(formatted).toBe('<b>T1</b>: 1.2345 (<code>addr1</code>)');
  });
});
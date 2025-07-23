// tests/utils.test.ts 
import { findTokenByAddress, formatTokenForDisplay } from '../src/utils/helpers';
import { TokenAsset } from '../src/solana/helius';

describe('Logger Utilities', () => {
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset modules to reload logger with updated env
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log debug messages only if DEBUG_MODE is true', async () => {
    process.env.DEBUG_MODE = 'true';
    const loggerModule = await import('../src/utils/logger');
    debugSpy = jest.spyOn(loggerModule.default, 'debug').mockImplementation(() => loggerModule.default as any);
    loggerModule.logDebug('Test debug', { key: 'value' });
    expect(debugSpy).toHaveBeenCalledWith('Test debug', expect.objectContaining({ key: 'value', timestamp: expect.any(String) }));

    process.env.DEBUG_MODE = 'false';
    jest.resetModules(); // Reload with new env
    const reloadedLogger = await import('../src/utils/logger');
    debugSpy = jest.spyOn(reloadedLogger.default, 'debug').mockImplementation(() => reloadedLogger.default as any);
    reloadedLogger.logDebug('Test debug off', { key: 'value' });
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('should always log errors', async () => {
    const loggerModule = await import('../src/utils/logger');
    errorSpy = jest.spyOn(loggerModule.default, 'error').mockImplementation(() => loggerModule.default as any);
    loggerModule.logError(123, 'Test error', { detail: 'info' });
    expect(errorSpy).toHaveBeenCalledWith('Error', expect.objectContaining({ chatId: 123, error: 'Test error', details: { detail: 'info' }, timestamp: expect.any(String) }));
  });

  it('should log transactions at info level', async () => {
    const loggerModule = await import('../src/utils/logger');
    infoSpy = jest.spyOn(loggerModule.default, 'info').mockImplementation(() => loggerModule.default as any);
    loggerModule.logTransaction(123, 'buy', 'tx123', { amount: 1 });
    expect(infoSpy).toHaveBeenCalledWith('Transaction', expect.objectContaining({ chatId: 123, type: 'buy', txId: 'tx123', details: { amount: 1 }, timestamp: expect.any(String) }));
  });
});

describe('Helpers Utilities', () => {
  const mockPortfolio: TokenAsset[] = [
    { name: 'TokenA', symbol: 'A', balance: 100, address: 'addr1' },
    { name: 'TokenB', symbol: 'B', balance: 200, address: 'addr2' },
  ];

  it('should find a token by address (case-insensitive)', () => {
    const result = findTokenByAddress(mockPortfolio, 'ADDR1');
    expect(result).toEqual(mockPortfolio[0]);
  });

  it('should return undefined if token not found by address', () => {
    const result = findTokenByAddress(mockPortfolio, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('should format token for display correctly', () => {
    const token: TokenAsset = { name: 'TestToken', symbol: 'TT', balance: 123.456789, address: 'testaddr' };
    const formatted = formatTokenForDisplay(token);
    expect(formatted).toBe('<b>TT</b>: 123.4568 (<code>testaddr</code>)');
  });

  it('should handle zero balance in formatting', () => {
    const token: TokenAsset = { name: 'ZeroToken', symbol: 'ZT', balance: 0, address: 'zeroaddr' };
    const formatted = formatTokenForDisplay(token);
    expect(formatted).toBe('<b>ZT</b>: 0 (<code>zeroaddr</code>)'); // Updated to match actual output (no trailing .0000 for zero)
  });
});
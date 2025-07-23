//tests/redis.test.ts
import { setState, getState, deleteState, setLock, isLocked, releaseLock } from '../src/utils/redis';
import { logDebug, logError } from '../src/utils/logger';
import Redis from 'ioredis';

jest.mock('ioredis');
jest.mock('../src/utils/logger');

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  on: jest.fn(),
} as any;

(Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

describe('Redis Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (logDebug as jest.Mock).mockImplementation(() => {});
    (logError as jest.Mock).mockImplementation(() => {});
    mockRedis.set.mockResolvedValue('OK');
  });

  test('setState/getState/deleteState: Handles string values', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify('testVal'));
    mockRedis.del.mockResolvedValue(1);
    await setState('key', 'testVal', 60);
    expect(mockRedis.set).toHaveBeenCalledWith('key', '"testVal"', 'EX', 60);
    const val = await getState<string>('key');
    expect(val).toBe('testVal');
    await deleteState('key');
    expect(mockRedis.del).toHaveBeenCalledWith('key');
  });

  test('setState/getState: Handles buffer in passkeyCache', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ iv: '6976' })); // hex 'iv'
    await setState('passkeyCache:key', { iv: Buffer.from('iv') } as any);
    expect(mockRedis.set).toHaveBeenCalledWith('passkeyCache:key', expect.stringContaining('"iv":"6976"'));
    const val = await getState<{ iv: string }>('passkeyCache:key');
    if (val) {
      expect(Buffer.from(val.iv, 'hex')).toBeInstanceOf(Buffer);
    } else {
      fail('Unexpected null value from getState');
    }
  });

  test('setLock/isLocked/releaseLock: Manages locks', async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.del.mockResolvedValue(1);
    const locked = await setLock('lockKey', 10);
    expect(locked).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('lockKey', '1', 'EX', 10, 'NX');
    const isLock = await isLocked('lockKey');
    expect(isLock).toBe(true);
    await releaseLock('lockKey');
    expect(mockRedis.del).toHaveBeenCalledWith('lockKey');
  });

  test('setState: Throws on error', async () => {
    mockRedis.set.mockRejectedValue(new Error('Set fail'));
    await expect(setState('key', 'val')).rejects.toThrow('Failed to set Redis key key: Set fail');
    expect(logError).toHaveBeenCalledWith(null, '[Redis] Failed to set key key', expect.objectContaining({ error: 'Set fail' }));
  });
});
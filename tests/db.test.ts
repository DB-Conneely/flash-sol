//tests/db.test.ts
// @ts-ignore - Ignore type declaration issue for mongodb-memory-server
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { getWallet, updateUserSlippage, saveWallet, deleteWallet, verifyPasskey, logMessage, logTransaction, connectToMongo, closeMongoConnection } from '../src/db';
import * as bcrypt from 'bcrypt';

describe('Database Utilities', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri(); // Set env for connectToMongo
    await connectToMongo();
    mongoClient = new MongoClient(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await closeMongoConnection();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    const db = mongoClient.db('flashsol');
    await db.collection('wallets').deleteMany({});
    await db.collection('messages').deleteMany({});
    await db.collection('transactions').deleteMany({});
  });

  it('should save and get a wallet', async () => {
    const chatId = 123;
    const publicKey = 'testPublicKey';
    const passkey = '123456';
    await saveWallet(chatId, publicKey, passkey);
    
    const wallet = await getWallet(chatId);
    expect(wallet).not.toBeNull();
    expect(wallet?.chatId).toBe(chatId);
    expect(wallet?.publicKey).toBe(publicKey);
    // Verify passkey is hashed
    expect(await bcrypt.compare(passkey, wallet?.passkey!)).toBe(true);
  });

  it('should update user slippage', async () => {
    const chatId = 123;
    const publicKey = 'testPublicKey';
    const passkey = '123456';
    await saveWallet(chatId, publicKey, passkey);
    
    const newSlippageBps = 1000;
    await updateUserSlippage(chatId, newSlippageBps);
    
    const wallet = await getWallet(chatId);
    expect(wallet?.slippageBps).toBe(newSlippageBps);
  });

  it('should delete a wallet', async () => {
    const chatId = 123;
    const publicKey = 'testPublicKey';
    const passkey = '123456';
    await saveWallet(chatId, publicKey, passkey);
    
    await deleteWallet(chatId);
    
    const wallet = await getWallet(chatId);
    expect(wallet).toBeNull();
  });

  it('should verify passkey correctly', async () => {
    const chatId = 123;
    const publicKey = 'testPublicKey';
    const passkey = '123456';
    await saveWallet(chatId, publicKey, passkey);
    
    const isValid = await verifyPasskey(chatId, passkey);
    expect(isValid).toBe(true);
    
    const isInvalid = await verifyPasskey(chatId, 'wrongpass');
    expect(isInvalid).toBe(false);
  });

  it('should log a message', async () => {
    const chatId = 123;
    const message = 'Test message';
    const type = 'info';
    await logMessage(chatId, message, type);
    
    const db = mongoClient.db('flashsol');
    const logged = await db.collection('messages').findOne({ chatId });
    expect(logged).not.toBeNull();
    expect(logged?.message).toBe(message);
    expect(logged?.type).toBe(type);
    expect(logged?.timestamp).toBeInstanceOf(Date);
  });

  it('should log a transaction', async () => {
    const chatId = 123;
    const type = 'buy' as const;
    const data = { txid: 'testTx', tokenAddress: 'testAddr' };
    await logTransaction(chatId, type, data);
    
    const db = mongoClient.db('flashsol');
    const logged = await db.collection('transactions').findOne({ chatId });
    expect(logged).not.toBeNull();
    expect(logged?.type).toBe(type);
    expect(logged?.txid).toBe(data.txid);
    expect(logged?.tokenAddress).toBe(data.tokenAddress);
    expect(logged?.timestamp).toBeInstanceOf(Date);
  });

  it('should handle no wallet cases gracefully', async () => {
    const chatId = 999; // Non-existent
    const wallet = await getWallet(chatId);
    expect(wallet).toBeNull();
    
    const isValid = await verifyPasskey(chatId, 'any');
    expect(isValid).toBe(false);
  });
});
// tests/bot.test.ts

import TelegramBot from 'node-telegram-bot-api';
import { handleBalanceCommand } from '../src/bot/commands/balance';
import { handleBuyCommand } from '../src/bot/commands/buy';
import { handleConnectCommand } from '../src/bot/commands/connect';
import { handleDisconnectCommand } from '../src/bot/commands/disconnect';
import { handlePrivateKeyCommand } from '../src/bot/commands/privatekey';
import { handleSellCommand } from '../src/bot/commands/sell';
import { handleWalletCommand } from '../src/bot/commands/wallet';
import { handleSlippageCommand } from '../src/bot/commands/slippage';
import { handleSecurityCheckCommand } from '../src/bot/commands/securitycheck';
import { handleMenuCommand } from '../src/bot/commands/menu';
import { getWallet } from '../src/db';
import { isPasskeyValid } from '../src/bot/cache';
import { generateWallet } from '../src/solana/wallet';
import { getParsedPortfolio } from '../src/solana/helius';
import { setState, isLocked, setLock, getState } from '../src/utils/redis';

// Mock dependencies
jest.mock('../src/db');
jest.mock('../src/bot/cache');
jest.mock('../src/solana/wallet');
jest.mock('../src/solana/helius');
jest.mock('../src/utils/redis');
jest.mock('../src/utils/logger');

const mockedGetWallet = getWallet as jest.Mock;
const mockedIsPasskeyValid = isPasskeyValid as jest.Mock;
const mockedGenerateWallet = generateWallet as jest.Mock;
const mockedGetParsedPortfolio = getParsedPortfolio as jest.Mock;
const mockedSetState = setState as jest.Mock;
const mockedIsLocked = isLocked as jest.Mock;
const mockedSetLock = setLock as jest.Mock;
const mockedGetState = getState as jest.Mock;

describe('Bot Command Handlers', () => {
  let mockBot: jest.Mocked<TelegramBot>;
  let mockMsg: TelegramBot.Message;

  beforeEach(() => {
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
      deleteMessage: jest.fn().mockResolvedValue(true),
      editMessageText: jest.fn(),
      editMessageReplyMarkup: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<TelegramBot>;

    mockMsg = {
      chat: { id: 12345, type: 'private' },
      message_id: 1,
      date: Date.now() / 1000,
    } as TelegramBot.Message;

    mockedGetWallet.mockReset();
    mockedIsPasskeyValid.mockReset();
    mockedGenerateWallet.mockReset();
    mockedGetParsedPortfolio.mockReset();
    mockedSetState.mockReset();
    mockedIsLocked.mockReset();
    mockedSetLock.mockReset();
    mockedGetState.mockReset();
  });

  test('handleWalletCommand - existing wallet', async () => {
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey', passkey: 'hashed' });

    await handleWalletCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, expect.stringContaining('Your Wallet:'), expect.objectContaining({ parse_mode: 'Markdown' }));
  });

  test('handleWalletCommand - new wallet', async () => {
    mockedGetWallet.mockResolvedValue(null);
    mockedGenerateWallet.mockReturnValue({ publicKey: 'newpub', secretKey: 'newsec' });

    await handleWalletCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "⚠️ If you forget your passcode, you cannot retrieve your private key. Note down the private key or passcode.\n⚠️ Never share your private key!");
    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Set a 4-6 digit passkey for your new wallet:', expect.any(Object));
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('passkeyState'), expect.any(Object), 60);
  });

  test('handleBuyCommand - session expired', async () => {
    mockedIsPasskeyValid.mockResolvedValue(false);

    await handleBuyCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Your secure session has expired. Please use /securitycheck to continue.');
  });

  test('handleBuyCommand - locked processing', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedIsLocked.mockResolvedValue(true);

    await handleBuyCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Please wait, another transaction is processing...');
  });

  test('handleBuyCommand - no wallet', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedIsLocked.mockResolvedValue(false);
    mockedGetWallet.mockResolvedValue(null);

    await handleBuyCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No wallet found. Use /wallet or /connect to load one.');
  });

  test('handleBuyCommand - valid setup', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedIsLocked.mockResolvedValue(false);
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });
    mockedSetLock.mockResolvedValue(true);

    await handleBuyCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "Input the token address (CA) you'd like to buy:", expect.objectContaining({ reply_markup: { force_reply: true } }));
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('flowState'), expect.objectContaining({ flow: 'buy' }), 60);
  });

  test('handleSellCommand - session expired', async () => {
    mockedIsPasskeyValid.mockResolvedValue(false);

    await handleSellCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Your secure session has expired. Please use /securitycheck to continue.');
  });

  test('handleSellCommand - no wallet', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedGetWallet.mockResolvedValue(null);

    await handleSellCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No wallet found. Use /wallet or /connect to load one.');
  });

  test('handleSellCommand - no tokens', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });
    mockedGetParsedPortfolio.mockResolvedValue([]);

    await handleSellCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, "You don't hold any tokens to sell.");
  });

  test('handleSellCommand - shows portfolio keyboard', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });
    mockedGetParsedPortfolio.mockResolvedValue([{ address: 'addr', symbol: 'TOK', balance: 100 }]);

    await handleSellCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Fetching your token holdings...');
    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Select a token to sell:', expect.any(Object));
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('flowState'), expect.objectContaining({ flow: 'sell' }), 300);
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('sell_portfolio_cache'), expect.any(Array), 300);
  });

  test('handleConnectCommand - existing wallet', async () => {
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });

    await handleConnectCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, expect.stringContaining('already connected'));
  });

  test('handleConnectCommand - prompts for private key', async () => {
    mockedGetWallet.mockResolvedValue(null);
    mockedIsLocked.mockResolvedValue(false);
    mockedSetLock.mockResolvedValue(true);

    await handleConnectCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Enter your private key to connect an existing wallet:', expect.objectContaining({ reply_markup: { force_reply: true } }));
    expect(mockedSetState).toHaveBeenCalled();
  });

  test('handleDisconnectCommand - no wallet', async () => {
    mockedGetWallet.mockResolvedValue(null);

    await handleDisconnectCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No wallet is currently connected.');
  });

  test('handleDisconnectCommand - prompts confirmation', async () => {
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });

    await handleDisconnectCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Are you sure you want to disconnect? This action is irreversible without your private key.', expect.any(Object));
  });

  test('handlePrivateKeyCommand - no wallet', async () => {
    mockedGetWallet.mockResolvedValue(null);

    await handlePrivateKeyCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No wallet found. Use /wallet or /connect to import one.');
  });

  test('handlePrivateKeyCommand - prompts passkey', async () => {
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });

    await handlePrivateKeyCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Enter your 4-6 digit passkey to view your private key:', expect.any(Object));
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('passkeyState'), expect.objectContaining({ context: 'privatekey' }), 60);
  });

  test('handleSlippageCommand - no wallet', async () => {
    mockedGetWallet.mockResolvedValue(null);

    await handleSlippageCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'You need to create or connect a wallet first. Use /wallet or /connect.');
  });

  test('handleSlippageCommand - prompts for slippage', async () => {
    mockedGetWallet.mockResolvedValue({ slippageBps: 500 });

    await handleSlippageCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, expect.stringContaining('Your current slippage is set to 5%'), expect.any(Object));
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('flowState'), expect.objectContaining({ flow: 'slippage' }), 60);
  });

  test('handleSecurityCheckCommand - valid session with refresh', async () => {
    mockedIsPasskeyValid.mockResolvedValue(true);

    await handleSecurityCheckCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, expect.stringContaining('Your secure session is active'), expect.any(Object));
  });

  test('handleSecurityCheckCommand - no wallet', async () => {
    mockedIsPasskeyValid.mockResolvedValue(false);
    mockedGetWallet.mockResolvedValue(null);

    await handleSecurityCheckCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No wallet found. Use /wallet or /connect to load one.');
  });

  test('handleSecurityCheckCommand - prompts passkey', async () => {
    mockedIsPasskeyValid.mockResolvedValue(false);
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });

    await handleSecurityCheckCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Enter your 4-6 digit passkey to refresh your session:', expect.any(Object));
    expect(mockedSetState).toHaveBeenCalled();
  });

  test('handleMenuCommand - existing menu refresh', async () => {
    mockedGetState.mockResolvedValueOnce({ messageId: 123 }); // Existing menu

    await handleMenuCommand(mockBot, mockMsg);

    expect(mockBot.editMessageReplyMarkup).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'Menu is already active.');
  });

  test('handleBalanceCommand - no wallet', async () => {
    mockedGetWallet.mockResolvedValue(null);

    await handleBalanceCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'No wallet found. Use /wallet or /connect to load one.');
  });

  test('handleBalanceCommand - empty portfolio', async () => {
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedGetParsedPortfolio.mockResolvedValue([]);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Real delay to bypass debounce
    await handleBalanceCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, '🔎 Loading your portfolio...');
    expect(mockBot.deleteMessage).toHaveBeenCalledWith(12345, 123);
    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, 'You have no fungible tokens with a balance.');
  });

  test('handleBalanceCommand - displays portfolio', async () => {
    mockedGetWallet.mockResolvedValue({ publicKey: 'pubkey' });
    mockedIsPasskeyValid.mockResolvedValue(true);
    mockedGetParsedPortfolio.mockResolvedValue([{ name: 'Token', symbol: 'TOK', balance: 100, address: 'addr' }]);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Real delay to bypass debounce
    await handleBalanceCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, '🔎 Loading your portfolio...');
    expect(mockBot.deleteMessage).toHaveBeenCalledWith(12345, 123);
    expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, expect.stringContaining('Your Portfolio:'), expect.any(Object));
    expect(mockedSetState).toHaveBeenCalledWith(expect.stringContaining('portfolio_cache'), expect.any(Array), 300);
  });
});
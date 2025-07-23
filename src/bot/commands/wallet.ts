// src/bot/commands/wallet.ts
// --- IMPORTS ---
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getWallet } from '../../db';
import { generateWallet } from '../../solana/wallet';
import { getWalletBalance } from '../../solana/client';
import { getPasskeyKeyboard } from '../keyboards';
import { logDebug, logError } from '../../utils/logger';
import { setState } from '../../utils/redis';

// --- EXPORTED FUNCTIONS ---
// Handles the /wallet command: Displays existing wallet details or generates a new one with passkey setup
export async function handleWalletCommand(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  logDebug('[Wallet] Received /wallet command', { chatId });
  
  const dbWallet = await getWallet(chatId);

  if (dbWallet) {
    try {
      const balance = await getWalletBalance(dbWallet.publicKey);
      const message = await bot.sendMessage(
        chatId,
        `Your Wallet:\nPublic Key: \`${dbWallet.publicKey}\`\nBalance: ${balance.toFixed(6)} SOL`,
        // ✅ FIX: The reply_markup with the buttons has been completely removed.
        { parse_mode: 'Markdown' }
      );
      setTimeout(() => bot.deleteMessage(chatId, message.message_id).catch(() => {}), 30000);
    } catch (error) {
      logError(chatId, '[Wallet] Error fetching balance', { error: (error as Error).message });
      const message = await bot.sendMessage(
        chatId,
        `Your Wallet:\nPublic Key: \`${dbWallet.publicKey}\`\nBalance: Unable to fetch`,
        { parse_mode: 'Markdown' }
      );
      setTimeout(() => bot.deleteMessage(chatId, message.message_id).catch(() => {}), 30000);
    }
    return;
  }

  // New wallet logic remains the same
  logDebug('[Wallet] Generating new wallet', { chatId });
  const newWallet = generateWallet();

  const warningMessage = await bot.sendMessage(chatId, '⚠️ If you forget your passcode, you cannot retrieve your private key. Note down the private key or passcode.\n⚠️ Never share your private key!');
  setTimeout(() => bot.deleteMessage(chatId, warningMessage.message_id).catch(() => {}), 15000);
  
  const passkeyMessage = await bot.sendMessage(chatId, 'Set a 4-6 digit passkey for your new wallet:', {
    reply_markup: getPasskeyKeyboard(chatId)
  });

  await setState(`bot:passkeyState:${chatId}`, {
    context: 'wallet',
    passkey: '',
    messageId: passkeyMessage.message_id,
    wallet: {
      publicKey: newWallet.publicKey,
      secretKey: newWallet.secretKey,
    },
  }, 60);

  setTimeout(() => {
      bot.deleteMessage(chatId, passkeyMessage.message_id).catch(() => {});
  }, 30000);
}

// Registers the /wallet command listener to trigger the handler
export function registerWalletCommand(bot: TelegramBot) {
  bot.onText(/\/wallet/, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
    handleWalletCommand(bot, msg);
  });
}
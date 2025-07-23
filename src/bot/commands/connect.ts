// src/bot/commands/connect.ts

// This module handles the /connect command, enabling users to import an existing Solana wallet by providing a private key.

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getWallet } from '../../db';
import { logError, logDebug } from '../../utils/logger';
import { setState, isLocked, setLock, releaseLock } from '../../utils/redis';

// ✅ Logic is now in an exportable function
export async function handleConnectCommand(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  logDebug('Received /connect command', { chatId });
  
  const existingWallet = await getWallet(chatId);
  if (existingWallet) {
    logDebug('Existing wallet found', { chatId });
    await bot.sendMessage(chatId, `Wallet ${existingWallet.publicKey} is already connected. Use /disconnect first.`).then(m =>
      setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 30000)
    );
    return;
  }
  if (await isLocked(`bot:processingLocks:${chatId}`)) {
    logDebug('Another operation in progress', { chatId });
    await bot.sendMessage(chatId, 'Please wait, another operation is in progress...').then(m =>
      setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 30000)
    );
    return;
  }
  await setLock(`bot:processingLocks:${chatId}`, 60);
  try {
    logDebug('Prompting for private key', { chatId });
    const message = await bot.sendMessage(chatId, 'Enter your private key to connect an existing wallet:', {
      reply_markup: { force_reply: true }
    });
    // Set state for the central message handler in commands.ts to catch the reply
    await setState(`bot:flowState:${chatId}`, { flow: 'connect', step: 'awaiting_pk', messageId: message.message_id }, 60);
  } catch (error) {
    const e = error as Error;
    logError(chatId, 'Failed to prompt for private key', { error: e.message });
    await releaseLock(`bot:processingLocks:${chatId}`);
  }
}

// Registers the command listener to wrap the handler function.
export function registerConnectCommand(bot: TelegramBot) {
  // ✅ onText listener is now a simple wrapper
  bot.onText(/\/connect/, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(()=>{});
    handleConnectCommand(bot, msg);
  });

  // The separate bot.on('message', ...) listener is REMOVED from this file.
}
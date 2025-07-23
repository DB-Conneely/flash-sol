// src/bot/commands/privatekey.ts

// This module handles the /privatekey command, which securely retrieves and displays the user's wallet private key after passkey verification.

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getWallet } from '../../db';
import { getPasskeyKeyboard } from '../keyboards';
import { logDebug } from '../../utils/logger';
import { setState } from '../../utils/redis';

// Logic extracted to be callable
export async function handlePrivateKeyCommand(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  logDebug('[PrivateKey] Received /privatekey command', { chatId });
  
  const dbWallet = await getWallet(chatId);
  if (!dbWallet) {
    logDebug('[PrivateKey] No wallet found in DB', { chatId });
    const message = await bot.sendMessage(chatId, 'No wallet found. Use /wallet or /connect to import one.');
    setTimeout(() => bot.deleteMessage(chatId, message.message_id).catch(() => {}), 30000);
    return;
  }

  logDebug('[PrivateKey] Wallet found, prompting passkey', { chatId });
  const message = await bot.sendMessage(chatId, 'Enter your 4-6 digit passkey to view your private key:', {
    reply_markup: getPasskeyKeyboard(chatId)
  });

  await setState(`bot:passkeyState:${chatId}`, {
    context: 'privatekey',
    passkey: '',
    messageId: message.message_id,
  }, 60);

  logDebug('[PrivateKey] Passkey prompt sent', { chatId });
}

// Registers the command listener to wrap the handler function.
export function registerPrivateKeyCommand(bot: TelegramBot) {
  bot.onText(/\/privatekey/, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(()=>{});
    handlePrivateKeyCommand(bot, msg);
  });
}
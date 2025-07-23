// src/bot/commands/disconnect.ts

// This module handles the /disconnect command, allowing users to securely remove their connected wallet after confirmation.

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getWallet } from '../../db';
import { getDisconnectKeyboard } from '../keyboards';
import { logDebug } from '../../utils/logger';

// Logic extracted to be callable
export async function handleDisconnectCommand(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  logDebug('[Disconnect] Received /disconnect command', { chatId });

  const dbWallet = await getWallet(chatId);
  if (!dbWallet) {
    logDebug('[Disconnect] No wallet found in DB', { chatId });
    await bot.sendMessage(chatId, 'No wallet is currently connected.').then(m =>
      setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 30000)
    );
    return;
  }
  
  logDebug('[Disconnect] Prompting confirmation', { chatId });
  await bot.sendMessage(chatId, 'Are you sure you want to disconnect? This action is irreversible without your private key.', {
    reply_markup: getDisconnectKeyboard(chatId)
  });
}

// Registers the command listener to wrap the handler function.
export function registerDisconnectCommand(bot: TelegramBot) {
  bot.onText(/\/disconnect/, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(()=>{});
    handleDisconnectCommand(bot, msg);
  });
}
// src/bot/commands/slippage.ts
// --- IMPORTS ---
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getWallet } from '../../db';
import { logDebug } from '../../utils/logger';
import { setState } from '../../utils/redis';

// --- EXPORTED FUNCTIONS ---
/**
 * Initiates the flow for a user to set their custom slippage.
 */
export async function handleSlippageCommand(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  logDebug('[Slippage] Received /slippage command', { chatId });

  const dbWallet = await getWallet(chatId);
  if (!dbWallet) {
    await bot.sendMessage(chatId, 'You need to create or connect a wallet first. Use /wallet or /connect.');
    return;
  }
  
  const currentSlippageBps = dbWallet.slippageBps || 500; // Default to 500 Bps (5%)
  const currentSlippagePercent = currentSlippageBps / 100;

  const message = await bot.sendMessage(
    chatId, 
    `Your current slippage is set to ${currentSlippagePercent}%. \n\nEnter your preferred slippage% (e.g., enter '1' for 1%):`, 
    {
      reply_markup: { force_reply: true }
    }
  );
  
  // Set state for the central message handler in commands.ts to catch the reply
  await setState(`bot:flowState:${chatId}`, { flow: 'slippage', step: 'awaiting_value', messageId: message.message_id }, 60);
}

/**
 * Registers the /slippage command listener.
 */
export function registerSlippageCommand(bot: TelegramBot) {
  bot.onText(/\/slippage/, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
    handleSlippageCommand(bot, msg);
  });
}
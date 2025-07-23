// src/bot/commands/balance.ts

// This module handles the /portfolio command (previously /balance), fetching and displaying the user's token holdings with pagination support.

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getWallet } from '../../db';
import { isPasskeyValid } from '../cache';
import { logDebug, logError } from '../../utils/logger';
import { setState } from '../../utils/redis';
import { getParsedPortfolio, TokenAsset } from '../../solana/helius';
import { formatTokenForDisplay } from '../../utils/helpers';

const DEBOUNCE_DELAY = 1000;
let lastCommandTime: { [chatId: number]: number } = {};
const TOKENS_PER_PAGE = 10;

// Formats a single page of the portfolio for display, including pagination controls.
export function formatPortfolioPage(portfolio: TokenAsset[], page: number): { text: string; keyboard: TelegramBot.InlineKeyboardMarkup } {
  const totalPages = Math.ceil(portfolio.length / TOKENS_PER_PAGE);
  const start = (page - 1) * TOKENS_PER_PAGE;
  const end = start + TOKENS_PER_PAGE;
  const tokensOnPage = portfolio.slice(start, end);

  let text = '<b>Your Portfolio:</b>\n\n';

  if (tokensOnPage.length === 0) {
    text += 'No tokens found on this page.';
  } else {
    text += tokensOnPage
      .map(token => formatTokenForDisplay(token))
      .join('\n');
  }

  text += `\n\nPage ${page} of ${totalPages}`;

  const buttons: TelegramBot.InlineKeyboardButton[] = [];
  if (page > 1) {
    buttons.push({ text: '⬅️ Back', callback_data: `portfolio:back:${page}` });
  }
  buttons.push({ text: '❌ Close', callback_data: 'portfolio:cancel:0' });
  if (page < totalPages) {
    buttons.push({ text: 'Next ➡️', callback_data: `portfolio:next:${page}` });
  }

  return { text, keyboard: { inline_keyboard: [buttons] } };
}

// ✅ NEW: The command logic is now in its own callable function.
export async function handleBalanceCommand(bot: TelegramBot, msg: Message) {
    const chatId = msg.chat.id;
    logDebug('[Portfolio] Received /portfolio command', { chatId });
    
    const currentTime = Date.now();
    if (lastCommandTime[chatId] && currentTime - lastCommandTime[chatId] < DEBOUNCE_DELAY) {
      logDebug('[Portfolio] Debouncing duplicate command', { chatId });
      return;
    }
    lastCommandTime[chatId] = currentTime;

    const dbWallet = await getWallet(chatId);
    if (!dbWallet) {
      const sentMsg = await bot.sendMessage(chatId, 'No wallet found. Use /wallet or /connect to load one.');
      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), 30000);
      return;
    }
    
    if (!(await isPasskeyValid(chatId))) {
      const sentMsg = await bot.sendMessage(chatId, 'Your secure session has expired. Please use /securitycheck to continue.');
      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), 30000);
      return;
    }

    try {
      const loadingMessage = await bot.sendMessage(chatId, '🔎 Loading your portfolio...');
      
      const portfolio = await getParsedPortfolio(dbWallet.publicKey);
      
      await bot.deleteMessage(chatId, loadingMessage.message_id).catch(() => {});

      if (portfolio.length === 0) {
        const sentMsg = await bot.sendMessage(chatId, 'You have no fungible tokens with a balance.');
        setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), 30000);
        return;
      }

      await setState(`portfolio_cache:${chatId}`, portfolio, 300);

      const { text, keyboard } = formatPortfolioPage(portfolio, 1);
      
      const finalMessage = await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
      setTimeout(() => {
          bot.deleteMessage(chatId, finalMessage.message_id).catch(() => {});
      }, 30000);

    } catch (error) {
      logError(chatId, '[Portfolio] Error fetching portfolio', { error });
      const sentMsg = await bot.sendMessage(chatId, 'Sorry, there was an error fetching your portfolio.');
      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), 30000);
    }
}

// Registers the command listener to wrap the handler function.
export function registerBalanceCommand(bot: TelegramBot) {
  // ✅ FIX: The onText listener is now a simple wrapper.
  bot.onText(/\/portfolio/, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
    handleBalanceCommand(bot, msg);
  });
}
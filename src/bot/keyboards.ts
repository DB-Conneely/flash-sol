// src/bot/keyboards.ts
// --- IMPORTS ---
import TelegramBot from 'node-telegram-bot-api';
import { logDebug } from '../utils/logger';
import { TokenAsset } from '../solana/helius';

// --- EXPORTED FUNCTIONS ---
// Generates the numeric passkey keyboard for secure input
export function getPasskeyKeyboard(chatId: number): TelegramBot.InlineKeyboardMarkup {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '1', callback_data: `passkey:digit:1` },
        { text: '2', callback_data: `passkey:digit:2` },
        { text: '3', callback_data: `passkey:digit:3` }
      ],
      [
        { text: '4', callback_data: `passkey:digit:4` },
        { text: '5', callback_data: `passkey:digit:5` },
        { text: '6', callback_data: `passkey:digit:6` }
      ],
      [
        { text: '7', callback_data: `passkey:digit:7` },
        { text: '8', callback_data: `passkey:digit:8` },
        { text: '9', callback_data: `passkey:digit:9` }
      ],
      [
        { text: '0', callback_data: `passkey:digit:0` },
        { text: 'Backspace', callback_data: `passkey:action:backspace` },
        { text: 'Confirm', callback_data: `passkey:action:confirm` }
      ],
      [
        { text: 'Cancel', callback_data: `passkey:action:cancel` }
      ]
    ]
  };
  logDebug('[Keyboards] Passkey keyboard generated', { chatId });
  return keyboard;
}

// Generates the buy amount selection keyboard with predefined SOL options
export function getBuyAmountKeyboard(tokenAddress: string, chatId: number): TelegramBot.InlineKeyboardMarkup {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '0.1 SOL', callback_data: `buy:amount:0.1:${tokenAddress}` },
        { text: '0.5 SOL', callback_data: `buy:amount:0.5:${tokenAddress}` }
      ],
      [
        { text: '1 SOL', callback_data: `buy:amount:1:${tokenAddress}` },
        { text: '5 SOL', callback_data: `buy:amount:5:${tokenAddress}` }
      ],
      [
        { text: '10 SOL', callback_data: `buy:amount:10:${tokenAddress}` },
        { text: 'Custom', callback_data: `buy:custom:${tokenAddress}` }
      ],
      [
        { text: 'Cancel', callback_data: `buy:cancel` }
      ]
    ]
  };
  logDebug('[Keyboards] Buy amount keyboard generated', { chatId, tokenAddress });
  return keyboard;
}

// Generates the sell percentage selection keyboard
export function getSellOptionKeyboard(tokenAddress: string, chatId: number): TelegramBot.InlineKeyboardMarkup {
  const keyboard = {
    inline_keyboard: [
      [
        { text: 'Sell 10%', callback_data: `sell:percent:10:${tokenAddress}` },
        { text: 'Sell 25%', callback_data: `sell:percent:25:${tokenAddress}` }
      ],
      [
        { text: 'Sell 50%', callback_data: `sell:percent:50:${tokenAddress}` },
        { text: 'Sell 100%', callback_data: `sell:percent:100:${tokenAddress}` }
      ],
      [
        { text: 'Sell X%', callback_data: `sell:custom:${tokenAddress}` },
        { text: 'Cancel', callback_data: `sell:cancel` }
      ]
    ]
  };
  logDebug('[Keyboards] Sell option keyboard generated', { chatId, tokenAddress });
  return keyboard;
}

// Generates the yes/no confirmation keyboard for wallet disconnection
export function getDisconnectKeyboard(chatId: number): TelegramBot.InlineKeyboardMarkup {
  const keyboard = {
    inline_keyboard: [
      [
        { text: 'YES', callback_data: `disconnect:confirm` },
        { text: 'NO', callback_data: `disconnect:cancel` }
      ]
    ]
  };
  logDebug('[Keyboards] Disconnect keyboard generated', { chatId });
  return keyboard;
}

// Creates a paginated 4x2 grid keyboard for selecting tokens to sell
export function getSellSelectionKeyboard(tokens: TokenAsset[], page: number = 1): TelegramBot.InlineKeyboardMarkup {
  const tokensPerPage = 8;
  const totalPages = Math.ceil(tokens.length / tokensPerPage);
  const start = (page - 1) * tokensPerPage;
  const pageTokens = tokens.slice(start, start + tokensPerPage);

  const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
  // Create the 4x2 grid of token buttons
  for (let i = 0; i < pageTokens.length; i += 2) {
    const row: TelegramBot.InlineKeyboardButton[] = [];
    row.push({
      text: `${pageTokens[i].symbol} ~ ${pageTokens[i].balance.toFixed(2)}`,
      callback_data: `sell:select_token:${pageTokens[i].address}`
    });
    if (pageTokens[i+1]) {
      row.push({
        text: `${pageTokens[i+1].symbol} ~ ${pageTokens[i+1].balance.toFixed(2)}`,
        callback_data: `sell:select_token:${pageTokens[i+1].address}`
      });
    }
    keyboard.push(row);
  }

  // Create the pagination and cancel buttons
  const navRow: TelegramBot.InlineKeyboardButton[] = [];
  if (page > 1) {
    navRow.push({ text: '⬅️ Previous', callback_data: `sell:page:${page - 1}` });
  }
  if (page < totalPages) {
    navRow.push({ text: 'Next ➡️', callback_data: `sell:page:${page + 1}` });
  }
  if(navRow.length > 0) keyboard.push(navRow);
  
  keyboard.push([{ text: '❌ Cancel', callback_data: 'sell:cancel' }]);

  return { inline_keyboard: keyboard };
}

// Creates the main menu keyboard in a 2-column layout
export function getMainMenuKeyboard(): TelegramBot.InlineKeyboardMarkup {
  const keyboard: TelegramBot.InlineKeyboardButton[][] = [
    [
      { text: '💰 Buy', callback_data: 'menu:buy' },
      { text: '💸 Sell', callback_data: 'menu:sell' }
    ],
    [
      { text: '💼 Portfolio', callback_data: 'menu:portfolio' },
      { text: '🔑 Wallet', callback_data: 'menu:wallet' }
    ],
    [
      { text: '🔗 Connect', callback_data: 'menu:connect' },
      { text: '✖️ Disconnect', callback_data: 'menu:disconnect' }
    ],
    [
      { text: '🔧 Slippage', callback_data: 'menu:slippage' },
      { text: '🤫 Private Key', callback_data: 'menu:privatekey' }
    ],
    [
      { text: '✅ Security', callback_data: 'menu:securitycheck' },
      { text: '❓ Help', callback_data: 'menu:help' }
    ],
    [
        { text: '❌ Close Menu', callback_data: 'menu:close' }
    ]
  ];
  return { inline_keyboard: keyboard };
}
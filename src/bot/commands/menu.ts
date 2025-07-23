// src/bot/commands/menu.ts

// This module manages the /menu command, displaying a centralized dashboard of bot commands via an inline keyboard.

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getMainMenuKeyboard } from '../keyboards';
import { logDebug } from '../../utils/logger';
import { setState, getState, deleteState } from '../../utils/redis';

// Handles the core logic for displaying or refreshing the main menu.
export async function handleMenuCommand(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  logDebug('[Menu] Received /menu command', { chatId });

  const menuText = "⚡️ **Welcome to your FlashBoard!** ⚡️\n\nAll commands are centralized below.\nClick **Help** for a full user guide.";
  const menuKeyboard = getMainMenuKeyboard();

  const existingMenuState = await getState<{ messageId: number }>(`bot:menuMessageId:${chatId}`);

  if (existingMenuState) {
    try {
      // ✅ FIX: We first try to 'ping' the old menu by editing it.
      // If this works, the menu exists. If it fails, we know it was deleted.
      await bot.editMessageReplyMarkup(menuKeyboard, {
        chat_id: chatId,
        message_id: existingMenuState.messageId,
      });
      
      // If the above line didn't fail, the menu is still active.
      await bot.sendMessage(chatId, 'Menu is already active.').then(m => 
        setTimeout(() => bot.deleteMessage(chatId, m.message_id), 10000)
      );
      return;
    } catch (error) {
      // This block runs if editing failed (i.e., message not found).
      // It means our state is stale, so we'll proceed to create a new menu.
      logDebug('[Menu] Stale menu state found. Creating a new menu.', { chatId });
      await deleteState(`bot:menuMessageId:${chatId}`);
    }
  }

  // Send a new menu and save its state.
  const sentMenu = await bot.sendMessage(chatId, menuText, { 
    parse_mode: 'Markdown',
    reply_markup: menuKeyboard 
  });
  await setState(`bot:menuMessageId:${chatId}`, { messageId: sentMenu.message_id });
}

// Registers the command listener to wrap the handler function.
export function registerMenuCommand(bot: TelegramBot) {
  bot.onText(/\/menu/, (msg) => {
    // ✅ FIX: Delete the user's command message for a cleaner interface.
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
    handleMenuCommand(bot, msg);
  });
}
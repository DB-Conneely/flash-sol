// src/index.ts
// --- IMPORTS ---
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { registerCommands } from './bot/commands';
import { connectToMongo, closeMongoConnection } from './db';
import { logError, logDebug } from './utils/logger';
import express from 'express';
import bodyParser from 'body-parser';


console.log('process.env at startup:', process.env);

// --- GLOBAL CONSTANTS ---
// Load Telegram bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
// Validate token presence and throw error if missing
if (!token) {
  logError(null, 'TELEGRAM_BOT_TOKEN not set in .env', {});
  throw new Error('TELEGRAM_BOT_TOKEN not set in .env');
}

// Initialize Telegram bot instance (no polling for webhook mode)
const bot = new TelegramBot(token);
// Debounce delay constant for command handling (in milliseconds)
const DEBOUNCE_DELAY = 1000;
// Object to track last command timestamps per chat ID for debouncing
let lastCommandTime: { [chatId: number]: number } = {};

// --- EXPORTED FUNCTIONS ---
// Handles the /help command by sending a formatted user guide message with commands and wallet management details
export async function handleHelpCommand(bot: TelegramBot, msg: Message) {
    const chatId = msg.chat.id;
    logDebug('Received /help command', { chatId });

    const helpText = `
*⚡️ Flash Sol - User Guide ⚡️*

Welcome! Here’s how to use your new trading bot.

*Commands:*

*/menu* - Displays the main command dashboard. This is your primary navigation tool.
*/buy* - Starts the process to buy any token. The bot will ask for the token's Contract Address (CA).
*/sell* - Opens a menu of your token holdings, allowing you to select one to sell.
*/portfolio* - Shows a list of your current tokens and their balances.
*/wallet* - Displays your wallet's public address and provides options to get your private key or disconnect.
*/slippage* - Set your slippage tolerance. This is the price change you are willing to accept for a trade to go through. Default is 5%. _Example: /slippage 2.5_
*/securitycheck* - Refreshes your secure session for 24 hours, allowing you to trade without re-entering your passkey.

---
*Wallet Management:*

*/connect* - Import an existing Solana wallet using its private key.
*/privatekey* - ⚠️ *Use with caution!* This displays your wallet's private key after passkey confirmation. Never share this with anyone.
*/disconnect* - Securely removes your wallet from the bot. This is irreversible if you don't have your private key saved elsewhere.
    `;
    
    await bot.sendMessage(chatId, helpText, { 
      parse_mode: 'Markdown',
      reply_markup: {
          inline_keyboard: [[{ text: '❌ Close', callback_data: 'menu:close' }]]
      }
    });
}

// --- MAIN BOT INITIALIZATION ---
// Asynchronous function to start the bot: Connects to MongoDB, sets up command listeners, and registers all commands
export async function startBot() {
  try {
    await connectToMongo();

    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const currentTime = Date.now();
      if (lastCommandTime[chatId] && currentTime - lastCommandTime[chatId] < DEBOUNCE_DELAY) {
        logDebug('Debouncing duplicate /start command', { chatId });
        return;
      }
      lastCommandTime[chatId] = currentTime;
      logDebug('Received /start command', { chatId });
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      
      const startMessage = "⚡️ *Congratulations on picking FlashSol!* ⚡️\nTrading just got much faster.\n\nPress /menu to get started.";
      await bot.sendMessage(chatId, startMessage, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/help/, (msg) => {
        bot.deleteMessage(msg.chat.id, msg.message_id).catch(()=>{});
        handleHelpCommand(bot, msg);
    });

    registerCommands(bot);
    logDebug('Bot started successfully', {});
  } catch (error) {
    logError(null, 'Failed to start bot', { error: (error as Error).message });
    process.exit(1);
  }
}

// --- PROCESS EVENT HANDLERS ---
// Handle SIGINT signal (e.g., Ctrl+C) to gracefully close MongoDB connection before exiting
process.on('SIGINT', async () => {
  logDebug('Received SIGINT, closing MongoDB connection', {});
  await closeMongoConnection();
  process.exit(0);
});

// Start the bot by calling the initialization function
startBot();

// Webhook Server Setup
const app = express();
app.use(bodyParser.json());

// Route for Telegram updates (POST /bot<token>)
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check route (GET /) for Fly.io or monitoring
app.get('/', (req, res) => {
  res.send('Bot is running');
});

// Start the Express server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  logDebug(`Express server running on port ${port}`, {});
});
// src/bot/commands.ts

// centralised callback handler for all commands. 

// --- IMPORTS ---
import TelegramBot, { Message } from 'node-telegram-bot-api';
import bs58 from 'bs58';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { handleHelpCommand } from '../index';
import { registerBalanceCommand, formatPortfolioPage, handleBalanceCommand } from './commands/balance';
import { handleBuyCommand, registerBuyCommand } from './commands/buy';
import { registerConnectCommand, handleConnectCommand } from './commands/connect';
import { handleDisconnectCommand, registerDisconnectCommand } from './commands/disconnect';
import { handlePrivateKeyCommand, registerPrivateKeyCommand } from './commands/privatekey';
import { handleSellCommand, registerSellCommand } from './commands/sell';
import { registerWalletCommand, handleWalletCommand } from './commands/wallet';
import { registerSecurityCheckCommand, handleSecurityCheckCommand } from './commands/securitycheck';
import { registerSlippageCommand, handleSlippageCommand } from './commands/slippage';
import { registerMenuCommand } from './commands/menu';
import { getWallet, saveWallet, deleteWallet, verifyPasskey, updateUserSlippage, logTransaction } from '../db';
import { getPasskeyKeyboard, getBuyAmountKeyboard, getSellOptionKeyboard, getSellSelectionKeyboard } from './keyboards';
import { encryptPasskey, decryptPasskey } from './cache';
import { encryptPrivateKey, decryptPrivateKey, isPrivateKeyValid, deletePrivateKeyCache } from './cache';
import { logError, logDebug } from '../utils/logger';
import { setState, getState, deleteState, releaseLock } from '../utils/redis';
import { TokenAsset, getTokenMetadata, getParsedPortfolio } from '../solana/helius';
import { buyToken, sellToken } from '../solana/trading';
import connection from '../solana/client';

// --- TYPE DEFINITIONS ---
// Interface for passkey input state during secure operations
interface PasskeyState {
  context: 'wallet' | 'connect' | 'privatekey' | 'disconnect' | 'securitycheck' | 'security_refresh';
  passkey: string; messageId: number;
  wallet?: { publicKey: string; secretKey: string; };
}
// Interface for tracking user flow states in commands like buy/sell
interface FlowState {
  flow: 'buy' | 'sell' | 'connect' | 'slippage' | 'securitycheck';
  step: 'awaiting_ca' | 'awaiting_pk' | 'awaiting_amount' | 'awaiting_custom_amount' | 'awaiting_value';
  messageId: number;
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
}
// Interface for trade execution details
interface TradeDetails {
    flow: 'buy' | 'sell';
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    amount: number;
}

// --- MAIN REGISTRATION FUNCTION ---
// Registers all bot commands and sets up central handlers for callbacks and messages
export function registerCommands(bot: TelegramBot) {
  [
    registerBalanceCommand, registerBuyCommand, registerConnectCommand, registerDisconnectCommand,
    registerPrivateKeyCommand, registerSellCommand, registerWalletCommand,
    registerSecurityCheckCommand, registerSlippageCommand,
    registerMenuCommand
  ].forEach(register => register(bot));
}


//rest of file is private 

//enquire into private repo
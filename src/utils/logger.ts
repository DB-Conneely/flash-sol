// src/utils/logger.ts
// --- IMPORTS ---
import winston from 'winston';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// --- GLOBAL CONFIGURATION ---
// Extract DEBUG_MODE from environment, default to 'false'
const { DEBUG_MODE = 'false' } = process.env;

// Determine log level based on DEBUG_MODE
const logLevel = DEBUG_MODE === 'true' ? 'debug' : 'info';

// Create a Winston logger instance with dynamic level and formats
const logger = winston.createLogger({
  level: logLevel, // Dynamic level: 'debug' or 'info'
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json() // Structured JSON for MongoDB integration
  ),
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File for production with rotation
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// --- EXPORTED FUNCTIONS ---
// Logs a transaction at info level with structured data
export const logTransaction = (
  chatId: number,
  type: 'buy' | 'sell' | 'send',
  txId: string,
  details: any
) => {
  logger.info('Transaction', { chatId, type, txId, details, timestamp: new Date().toISOString() });
};

// Logs an error with optional chat ID and details
export const logError = (chatId: number | null, error: string, details: any = {}) => {
  logger.error('Error', { chatId, error, details, timestamp: new Date().toISOString() });
};

// Logs debug messages only if DEBUG_MODE is enabled
export const logDebug = (message: string, metadata: any = {}) => {
  if (logLevel === 'debug') {
    logger.debug(message, { ...metadata, timestamp: new Date().toISOString() });
  }
};

// Default export of the Winston logger instance
export default logger;
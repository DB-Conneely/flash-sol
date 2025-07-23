// tests/index.test.ts
import { handleHelpCommand } from '../src/index';
import TelegramBot, { Message } from 'node-telegram-bot-api';

// Mock the TelegramBot
jest.mock('node-telegram-bot-api');

describe('handleHelpCommand', () => {
  let mockBot: jest.Mocked<TelegramBot>;
  let mockMsg: Message;

  beforeEach(() => {
    mockBot = new TelegramBot('token', { polling: true }) as jest.Mocked<TelegramBot>;
    mockBot.sendMessage = jest.fn().mockResolvedValue({});

    mockMsg = {
      chat: { id: 12345 },
      message_id: 1,
      from: { id: 12345, is_bot: false, first_name: 'Test' },
      date: Date.now(),
      text: '/help',
    } as Message;
  });

  it('should send the help message', async () => {
    await handleHelpCommand(mockBot, mockMsg);

    expect(mockBot.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      12345,
      expect.stringContaining('*⚡️ Flash Sol - User Guide ⚡️*'),
      expect.objectContaining({
        parse_mode: 'Markdown',
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      })
    );
  });
});
import { Buffer } from 'buffer';
global.Buffer = Buffer; // Polyfill for web3.js Buffer needs

require('dotenv').config({ path: './.env' }); // Load real .env for tests

jest.mock('process', () => ({
  ...jest.requireActual('process'),
  exit: jest.fn().mockImplementation((code) => console.log(`Mocked exit with code ${code}`)), // Log instead of exit
}));

global.afterAll(() => {
  jest.clearAllTimers(); // Clean timers/leaks
});
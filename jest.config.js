// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  forceExit: true, // Helps prevent hangs after tests are done
  clearMocks: true, // Automatically clear mock calls and instances between every test
};
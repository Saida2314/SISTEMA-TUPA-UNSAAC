module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
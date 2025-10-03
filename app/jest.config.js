module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./test/setupTests.ts'],
  testMatch: ['**/test/**/*.test.(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community)/)'
  ],
};
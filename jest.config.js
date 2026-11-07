module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['<rootDir>/scripts/system-guide/'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/style.js',
  },
};

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/graph$': '<rootDir>/__mocks__/graph.js',
    '^@/graph\\.js$': '<rootDir>/__mocks__/graph.js',
    '^@/src/graph$': '<rootDir>/__mocks__/graph.js',
    '^@/src/graph\\.js$': '<rootDir>/__mocks__/graph.js'
  },
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true
    }]
  },
  testMatch: ['**/tests/**/*.test.{ts,js}'],
  transformIgnorePatterns: [
    'node_modules/(?!(kuzu-wasm|.*\\.js$)/)',
    'src/graph\\.js$'
  ]
};
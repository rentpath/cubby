module.exports = {
  displayName: '@cubbyjs',
  globals: {
    'ts-jest': {
      babelConfig: true,
      diagnostics: false,
    },
  },
  roots: ['<rootDir>/packages'],
  testMatch: ['**/*.test.ts?(x)'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.ts(x)?$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/src/**/*.{js,jsx,ts,tsx}', // loosen up as we go
    // "!src/**/__tests__/**",
    // "!src/**/__fixtures__/**",
    // "!src/components/PdpPoc/**"
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    './packages/cubbyjs-common': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './packages/cubbyjs-preact': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './packages/cubbyjs-react': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },

  },
}

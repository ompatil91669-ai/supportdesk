module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  clearMocks: true,
  setupFiles: ["<rootDir>/tests/setup.ts"],
  collectCoverageFrom: ["src/services/**/*.ts"],
  coverageThreshold: {
    global: {
      lines: 70,
      statements: 70,
    },
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { diagnostics: { ignoreCodes: [151002] } }],
  },
};

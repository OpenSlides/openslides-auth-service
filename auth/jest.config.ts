import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test', '<rootDir>/src'],
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    coverageReporters: ['json-summary', 'text', 'lcov'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
    testEnvironmentOptions: {
        url: 'http://localhost:4200',
    },
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}'],
    globalSetup: './test/setup.ts',
    globalTeardown: './test/teardown.ts'
};

export default config;

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test', '<rootDir>/src'],
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    coverageReporters: ['json-summary', 'text', 'lcov'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
    testURL: 'http://localhost:4200',
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}']
};

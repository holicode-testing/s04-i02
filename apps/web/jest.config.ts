/* eslint-disable */

export default {
  displayName: 'web',
  preset: '../../jest.preset.cjs',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/test-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleDirectories: ['<rootDir>/node_modules', '../../node_modules'],
  transform: {
    '^.+\\.tsx?': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
            dynamicImport: true,
            import_meta: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@holicode-test)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)',
  ],
  coverageDirectory: '../../coverage/apps/web',
};

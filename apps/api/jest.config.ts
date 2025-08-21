/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.cjs',
  testEnvironment: 'node',
  globals: {
    'process.env': {
      SUPABASE_JWT_SECRET:
        'super-secret-jwt-token-with-at-least-32-characters-long',
      PRISMA_QUERY_ENGINE_LIBRARY:
        'apps/api/node_modules/prisma/libquery_engine-linux-arm64-openssl-3.0.x.so.node',
    },
  },
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
};

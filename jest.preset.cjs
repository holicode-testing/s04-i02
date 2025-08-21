const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@swc/core|@swc/jest)'],
};

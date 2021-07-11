const { resolve } = require('path')
const { compilerOptions } = require('./tsconfig.base.json')

module.exports = {
  rootDir: resolve(__dirname),
  testEnvironment: 'node',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        ...compilerOptions,
        sourceMap: true,
      },
    },
    '__VERSION__': '',
    '__DEV__': false,
    '__SSR__': false,
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'd.ts', 'tsx', 'node'],
  snapshotSerializers: [require.resolve('jest-serializer-vue')],
  coverageDirectory: 'coverage',
}

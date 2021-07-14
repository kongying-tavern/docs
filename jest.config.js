const { resolve } = require('path')
const { compilerOptions } = require('./tsconfig.base.json')
const fs = require('fs')

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
  moduleNameMapper: {
    '^dayjs/esm/(.*)$': 'dayjs/$1',
  },
  snapshotSerializers: [require.resolve('jest-serializer-vue')],
  coverageDirectory: 'coverage',
  projects: fs.readdirSync('./packages').map((folder) => ({
    displayName: folder,
    preset: 'ts-jest/presets/js-with-babel',
    transformIgnorePatterns: ['node_modules/(?!(@vuepress/client|dayjs)/)'],
    testMatch: [`<rootDir>/packages/${folder}/__tests__/**/*.spec.{js,ts}`],
  })),
}

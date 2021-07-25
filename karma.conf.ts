export default function (config: {
  set: (arg0: {
    frameworks: string[]
    files: string[]
    preprocessors: { '**/*.spec.js': string[] }
    autoWatch: boolean
    reporters: string[]
    browsers: string[]
  }) => void
}): void {
  config.set({
    frameworks: ['mocha'],
    files: ['tests/**/*.spec.js'],
    preprocessors: {
      '**/*.spec.js': ['webpack', 'sourcemap'],
    },
    autoWatch: true,
    reporters: ['spec'],
    browsers: ['ChromeHeadless'],
  })
}

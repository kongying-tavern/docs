export const ignoreDeadLinksConfig = [
  '/playground',
  /^https?:\/\/localhost/,
  /\/repl\//,
  (url: string) => {
    return url.toLowerCase().includes('ignore')
  },
]

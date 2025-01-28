export const ignoreDeadLinksConfig = [
  // ignore exact url "/playground"
  '/playground',
  // ignore all localhost links
  /^https?:\/\/localhost/,
  // ignore all links include "/repl/""
  /\/repl\//,
  // custom function, ignore all links include "ignore"
  (url: string) => {
    return url.toLowerCase().includes('ignore')
  },
]

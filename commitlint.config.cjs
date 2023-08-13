module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['i18n']],
    'footer-max-line-length': [0],
  },
}

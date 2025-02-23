export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['i18n', 'forum', 'blog', 'theme']],
    'footer-max-line-length': [0],
  },
}

import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
  unocss: true,
  typescript: true,
  vue: true,
  jsonc: false,
  yaml: false,
  ignores: [
    '**/*.md',
    '**/*.yaml',
    '**/*.yml',
    '**/dist',
    '**/node_modules',
    '**/public',
    '**/temp',
    '**/cache',
  ],
  stylistic: {
    indent: 2,
    quotes: 'single',
    jsx: false,
  },

  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },

  overrides: {
    javascript: {
      'no-console': 'warn',
      'default-param-last': 'error',
    },
    typescript: {
      'ts/no-explicit-any': 'warn',

      // 命名规范
      'ts/naming-convention': [
        'error',
        // TS interface 只允许大驼峰
        {
          selector: 'interface',
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
        },
        // TS Type 只允许大驼峰
        {
          selector: 'typeLike',
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
        },
        // 变量只允许大小驼峰、全大写下划线、全小写下划线
        {
          selector: 'variable',
          format: ['PascalCase', 'camelCase', 'UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
      ],

      // 禁止未使用的值
      'ts/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },

    vue: {
      'vue/multi-word-component-names': 'off',

      'vue/prop-name-casing': ['error', 'camelCase'],

      'vue/no-ref-object-reactivity-loss': 'off',

      'vue/custom-event-name-casing': 'off',

      'vue/no-unused-vars': [
        'warn',
        {
          ignorePattern: '^_',
        },
      ],
    },
  },
})

import globals from 'globals'
import pluginPrettier from 'eslint-plugin-prettier/recommended'

const config = [
  { languageOptions: { globals: { ...globals.node, ...globals.mocha } } },
  pluginPrettier,
  {
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_$',
          argsIgnorePattern: '^_',
          caughtErrors: 'none'
        }
      ]
    }
  },
  {
    ignores: ['coverage/', 'docs/', 'dist/', 'tmp/']
  }
]

export default config

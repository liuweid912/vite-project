import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import pluginPrettier from 'eslint-plugin-prettier'
import configPrettier from 'eslint-config-prettier'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  configPrettier,
  // ── TypeScript / JavaScript 文件：使用 @typescript-eslint/parser ──
  {
    files: ['**/*.{ts,js}'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      prettier: pluginPrettier,
      '@typescript-eslint': tseslint
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  // ── Vue SFC 文件：使用 vue-eslint-parser，内部用 tsParser ──
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: globals.browser,
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
        parser: tsParser
      }
    },
    plugins: {
      prettier: pluginPrettier,
      '@typescript-eslint': tseslint
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  // 全局忽略
  {
    ignores: ['dist', 'node_modules', '**/*.d.ts', 'vite.config.ts']
  }
]

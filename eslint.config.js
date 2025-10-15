// eslint.config.js (flat config for ESLint v9)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Ignore generated/build artifacts
  {
    ignores: ['node_modules/**', 'build/**', 'dist/**', '.react-router/**'],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules (with type-checking)
  ...tseslint.configs.recommendedTypeChecked,

  // React/TSX layer
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        // Use your root tsconfig for type-aware linting
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React 17+ (and 19) don’t require React in scope
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
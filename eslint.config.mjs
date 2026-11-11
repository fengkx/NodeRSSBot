import tsEslint from 'typescript-eslint';
import globals from 'globals';
import js from '@eslint/js';

export default [
    js.configs.recommended,
    ...tsEslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
                ...globals.jest
            },

            ecmaVersion: 2018,
            sourceType: 'commonjs'
        },

        rules: {
            camelcase: 'off',
            radix: 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true
                }
            ]
        }
    }
];

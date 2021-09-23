module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    extends: ['plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/recommended-requiring-type-checking'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
    },
    plugins: [
        'eslint-plugin-import',
        'eslint-plugin-jsdoc',
        'eslint-plugin-prefer-arrow',
        '@typescript-eslint',
        '@typescript-eslint/tslint'
    ],
    rules: {
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'array'
            }
        ],
        '@typescript-eslint/ban-types': [
            'error',
            {
                types: {
                    Object: {
                        message: 'Avoid using the `Object` type. Did you mean `object`?'
                    },
                    Function: {
                        message: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.'
                    },
                    Boolean: {
                        message: 'Avoid using the `Boolean` type. Did you mean `boolean`?'
                    },
                    Number: {
                        message: 'Avoid using the `Number` type. Did you mean `number`?'
                    },
                    String: {
                        message: 'Avoid using the `String` type. Did you mean `string`?'
                    },
                    Symbol: {
                        message: 'Avoid using the `Symbol` type. Did you mean `symbol`?'
                    }
                }
            }
        ],
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/explicit-member-accessibility': [
            'error',
            {
                accessibility: 'explicit',
                overrides: {
                    accessors: 'explicit',
                    constructors: 'explicit',
                    parameterProperties: 'explicit'
                }
            }
        ],
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'default',
                format: ['strictCamelCase', 'PascalCase']
            },
            {
                selector: 'typeParameter',
                format: ['PascalCase']
            },
            {
                selector: 'enumMember',
                format: ['UPPER_CASE']
            },
            {
                selector: 'variable',
                modifiers: ['const'],
                format: ['UPPER_CASE', 'camelCase']
            },
            {
                selector: 'interface',
                format: ['PascalCase']
            },
            {
                selector: 'typeAlias',
                format: ['PascalCase']
            },
            {
                selector: 'class',
                format: ['StrictPascalCase']
            },
            {
                selector: 'classProperty',
                modifiers: ['private'],
                format: ['strictCamelCase'],
                leadingUnderscore: 'require'
            },
            {
                selector: 'classProperty',
                modifiers: ['public', 'static', 'readonly'],
                format: ['UPPER_CASE']
            },
            {
                selector: 'classProperty',
                modifiers: ['private', 'static', 'readonly'],
                format: ['UPPER_CASE']
            },
            {
                selector: 'classProperty',
                modifiers: ['public', 'readonly'],
                format: ['snake_case', 'strictCamelCase']
            },
            {
                selector: 'objectLiteralProperty',
                format: ['camelCase', 'snake_case', 'PascalCase']
            }
        ],
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false }],
        '@typescript-eslint/no-inferrable-types': [
            'error',
            {
                ignoreParameters: true
            }
        ],
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-shadow': [
            'warn',
            {
                hoist: 'all'
            }
        ],
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/quotes': ['error', 'single'],
        '@typescript-eslint/triple-slash-reference': [
            'error',
            {
                path: 'always',
                types: 'prefer-import',
                lib: 'always'
            }
        ],
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-body-style': 'error',
        'arrow-parens': ['off', 'always'],
        complexity: 'off',
        'constructor-super': 'error',
        curly: 'error',
        'dot-notation': 'off',
        eqeqeq: ['error', 'smart'],
        'guard-for-in': 'error',
        'id-blacklist': [
            'error',
            'any',
            'Number',
            'number',
            'String',
            'string',
            'Boolean',
            'boolean',
            'Undefined',
            'undefined'
        ],
        'id-match': 'error',
        'import/no-deprecated': 'warn',
        'import/order': [
            'error',
            {
                groups: ['external', 'internal'],
                pathGroups: [
                    {
                        pattern: '^[^src.]*',
                        group: 'external'
                    },
                    {
                        pattern: '^[src.]*',
                        group: 'internal'
                    }
                ],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true
                }
            }
        ],
        'jsdoc/check-alignment': 'error',
        'jsdoc/check-indentation': 'error',
        'jsdoc/newline-after-description': 'error',
        'max-classes-per-file': ['error', 1],
        'max-len': [
            'error',
            {
                code: 120
            }
        ],
        'new-parens': 'error',
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-cond-assign': 'error',
        'no-console': 'off',
        'no-debugger': 'error',
        'no-empty': 'off',
        'no-empty-function': 'off',
        'no-eval': 'error',
        'no-fallthrough': 'error',
        'no-invalid-this': 'off',
        'no-multiple-empty-lines': 'off',
        'no-new-wrappers': 'error',
        'no-restricted-imports': ['error', 'rxjs/Rx'],
        'no-shadow': 'warn',
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-undef-init': 'error',
        'no-unsafe-finally': 'error',
        'no-unused-expressions': 'error',
        'no-unused-labels': 'error',
        'no-unused-vars': 'error',
        'no-use-before-define': 'off',
        'no-var': 'error',
        'object-shorthand': 'error',
        'one-var': ['error', 'never'],
        'prefer-arrow/prefer-arrow-functions': ['error'],
        'prefer-const': 'error',
        quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
        radix: 'error',
        'spaced-comment': [
            'error',
            'always',
            {
                markers: ['/']
            }
        ],
        'use-isnan': 'error',
        'valid-typeof': 'off',
        '@typescript-eslint/tslint/config': [
            'error',
            {
                rules: {
                    typedef: [
                        true,
                        'call-signature',
                        'property-declaration',
                        'parameter',
                        'object-destructuring',
                        'array-destructuring'
                    ],
                    whitespace: [true, 'check-branch', 'check-decl', 'check-operator', 'check-separator', 'check-type']
                }
            }
        ]
    }
};

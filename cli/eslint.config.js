import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import { fileURLToPath } from "node:url";
import ts from "typescript-eslint";

const gitignorePath = fileURLToPath(
    new globalThis.URL("./.gitignore", import.meta.url)
);

/** @type {import('eslint').Linter.Config} */
export default ts.config(
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    unicorn.configs.recommended,
    ...ts.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                project: ["./tsconfig.json"],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        ignores: ["eslint.config.js"],
        rules: {
            "no-undef": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "unicorn/prefer-ternary": "off",
            "no-console": "off",
            "unicorn/filename-case": [
                "warn",
                {
                    cases: { pascalCase: true, kebabCase: true },
                    multipleFileExtensions: false,
                },
            ],
            "unicorn/no-null": "off",
            "unicorn/prevent-abbreviations": "off",
        },
    },
    {
        rules: { "unicorn/prefer-top-level-await": "off" },
    }
);

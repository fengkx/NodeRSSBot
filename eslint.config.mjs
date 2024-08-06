import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.commonjs,
            ...globals.jest,
        },

        parser: tsParser,
        ecmaVersion: 2018,
        sourceType: "commonjs",
    },

    rules: {
        camelcase: "off",
        radix: ["error", "as-needed"],
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-ts-comment": "warn",
	"@typescript-eslint/no-unused-expressions": "off"
    },
}];

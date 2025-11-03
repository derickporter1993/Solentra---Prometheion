import babelParser from "@babel/eslint-parser";
import lwc from "@lwc/eslint-plugin-lwc";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          parserOpts: {
            plugins: ["classProperties", "decorators-legacy"],
          },
        },
      },
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      lwc: lwc,
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
    },
  },
  eslintConfigPrettier,
];

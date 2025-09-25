import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.jquery,
				sceditor: false,
			},

			ecmaVersion: 6,
			sourceType: "module",
		},

		rules: {
			"no-bitwise": "error",
			camelcase: "error",
			curly: "error",
			eqeqeq: "error",
			"guard-for-in": "error",
			"wrap-iife": ["error", "any"],

			indent: ["error", "tab", {
				SwitchCase: 1,
			}],

			"no-use-before-define": ["error", {
				functions: false,
			}],

			"new-cap": ["error", {
				capIsNewExceptions: ["Event"],
			}],

			"no-caller": "error",

			"no-empty": ["error", {
				allowEmptyCatch: true,
			}],

			"no-new": "error",
			"no-plusplus": "off",
			quotes: ["error", "single"],
			"no-undef": "error",
			"no-unused-vars": "error",
			strict: "error",
			"max-params": ["error", 4],
			"max-depth": ["error", 4],

			"max-len": ["error", {
				code: 80,
				ignoreUrls: true,
				ignoreRegExpLiterals: true,
			}],

			semi: ["error", "always"],
			"no-cond-assign": ["error", "except-parens"],
			"no-debugger": "error",
			"no-eq-null": "error",
			"no-eval": "error",
			"no-unused-expressions": "error",
			"block-scoped-var": "error",
			"no-iterator": "error",
			"linebreak-style": ["error", "unix"],
			"comma-style": ["error", "last"],
			"no-loop-func": "error",
			"no-multi-str": "error",
			"no-proto": "error",
			"no-script-url": "error",
			"no-shadow": "off",
			"dot-notation": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-invalid-this": "off",
			"no-with": "error",

			"brace-style": ["error", "1tbs", {
				allowSingleLine: false,
			}],

			"no-mixed-spaces-and-tabs": "error",

			"key-spacing": ["error", {
				beforeColon: false,
				afterColon: true,
			}],

			"space-unary-ops": "error",

			"space-before-function-paren": ["error", {
				anonymous: "always",
				named: "never",
				asyncArrow: "never",
			}],

			"no-spaced-func": "error",
			"array-bracket-spacing": ["error", "never"],

			"keyword-spacing": ["error", {
				before: true,
				after: true,
			}],

			"space-in-parens": ["error", "never"],
			"comma-dangle": ["error", "never"],
			"no-trailing-spaces": "error",
			"eol-last": "error",
			"space-infix-ops": "error",
			"space-before-blocks": ["error", "always"],
		},
	},

	{
		files: ["src/icons/*.js"],
		languageOptions: {
			sourceType: "script",
		},
	},

	{
		files: ["src/formats/*.js"],
		languageOptions: {
			sourceType: "script",
		},
	},

	{
		files: ["src/plugins/*.js"],
		languageOptions: {
			sourceType: "script",
		},
	},

	{
		files: ["languages/*.js"],
		languageOptions: {
			ecmaVersion: 5,
			sourceType: "script",
		},

		rules: {
			"dot-notation": "off",

			"max-len": ["error", {
				code: 400,
				ignoreUrls: true,
				ignoreRegExpLiterals: true,
			}],
		},
	},

	{
		files: ["tests/dev-server.js", "tests/loader.js"],
		languageOptions: {
			globals: {
				...globals.node
			},
		},

		rules: {
			"new-cap": "off",
			strict: "off",
			"max-params": "off",
			"max-depth": ["error", 6],
			"max-len": "off",
		},
	},

	{
		files: ["tests/**/*.js"],
		ignores: ["tests/dev-server.js", "tests/loader.js"],
		languageOptions: {
			globals: {
				...globals.qunit,
				QUnit: true,
				module: true,
				test: true,
				asyncTest: true,
				rangy: true,
				sinon: true,
				runner: true,
				patchConsole: true,
				less: true,
			},
		},

		rules: {
			"new-cap": "off",
			strict: "off",
			"max-params": "off",
			"max-depth": ["error", 6],

			"max-len": ["error", {
				code: 120,
				ignoreUrls: true,
				ignoreRegExpLiterals: true,
			}],
		},
	}
]);
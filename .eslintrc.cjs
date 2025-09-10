/* eslint-env node */
module.exports = {
  root: true,
  ignorePatterns: ["node_modules/", "dist/", "build/", ".next/", ".vercel/"],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "detect" } },
  env: { browser: true, node: true, es2022: true },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import", "tailwindcss"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:tailwindcss/recommended",
    "prettier"
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "import/no-unresolved": "off"
  },
  overrides: [
    { files: ["server/**/*"], env: { node: true, browser: false } },
    { files: ["client/**/*.{ts,tsx}"], env: { browser: true } }
  ]
};
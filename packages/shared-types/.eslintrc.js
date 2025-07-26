module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off" // Types can be unused
  }
};

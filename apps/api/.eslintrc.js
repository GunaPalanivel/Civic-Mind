{
  ("parser");
  ("@typescript-eslint/parser", "plugins");
  (["@typescript-eslint"], "extends");
  (["eslint;recommended", "@typescript-eslint/recommended"], "rules");
  {
    ("no-unused-vars");
    ("off", "@typescript-eslint/no-unused-vars");
    [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ];
  }
}

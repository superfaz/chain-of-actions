import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["coverage/", "dist/"] },
  ...tseslint.configs.recommended,
  {
    ...pluginJs.configs.recommended,
    files: ["src/", "tests/"],
  },
];

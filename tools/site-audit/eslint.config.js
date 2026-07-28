import { config } from "@workspace/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      // BASE_URL, DEV and MODE are Vite's own `import.meta.env` built-ins, not
      // environment variables Turbo needs declared in turbo.json.
      "turbo/no-undeclared-env-vars": [
        "warn",
        { allowList: ["BASE_URL", "DEV", "MODE", "VITE_.*"] },
      ],
      // The worker imports `../build/server`, which only exists after a build.
      // `@ts-expect-error` would itself error once the build is present, so the
      // described `@ts-ignore` is the correct tool here.
      "@typescript-eslint/ban-ts-comment": [
        "warn",
        { "ts-ignore": "allow-with-description" },
      ],
    },
  },
  { ignores: ["build/**", ".react-router/**"] },
]

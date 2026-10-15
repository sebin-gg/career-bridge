// eslint-config-next 16 ships flat configs, so the legacy FlatCompat bridge is
// gone: `compat.extends("next/core-web-vitals")` validated the flat config as an
// eslintrc config and crashed with "Converting circular structure to JSON",
// which meant `pnpm run lint` could never run.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;

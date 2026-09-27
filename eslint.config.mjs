import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
    },
  },
  {
    // AGENTS.md "import 방향": app → components → hooks → features → domain → lib.
    // 기존 위반을 정리하는 동안은 warn이며, 0건이 되면 error로 올린다.
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "import/no-restricted-paths": [
        "warn",
        {
          zones: [
            {
              target: "./src/lib",
              from: [
                "./src/domain",
                "./src/features",
                "./src/hooks",
                "./src/components",
                "./src/app",
              ],
              message: "lib은 업무 규칙과 JSX를 모른다. AGENTS.md 폴더 구조 참고.",
            },
            {
              target: "./src/domain",
              from: ["./src/features", "./src/hooks", "./src/components", "./src/app"],
              message:
                "domain은 features·hooks·components·app을 가져다 쓰지 않는다. AGENTS.md 폴더 구조 참고.",
            },
            {
              target: "./src/features",
              from: ["./src/hooks", "./src/components", "./src/app"],
              message:
                "features는 hooks·components·app을 가져다 쓰지 않는다. AGENTS.md 폴더 구조 참고.",
            },
            {
              target: "./src/hooks",
              from: ["./src/components", "./src/app"],
              message: "hooks는 JSX 조각과 라우트를 가져다 쓰지 않는다. AGENTS.md 폴더 구조 참고.",
            },
            {
              target: "./src/components",
              from: "./src/app",
              message: "components는 특정 라우트를 가져다 쓰지 않는다. AGENTS.md 폴더 구조 참고.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

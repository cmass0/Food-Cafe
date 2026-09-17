import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// 애플리케이션 설정은 .env.local에서, 테스트 계정은 .env.e2e.local에서 읽는다.
// 테스트 전용 값이 같은 이름으로 존재하면 애플리케이션 설정보다 우선한다.
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env.e2e.local", override: true, quiet: true });

const E2E_BASE_URL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  // 로컬 개발 서버의 첫 컴파일과 이미지 업로드·Server Action·정리까지 포함한다.
  timeout: 120_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",

  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

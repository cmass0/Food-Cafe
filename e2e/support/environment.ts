export type E2EAccount = {
  email: string;
  password: string;
};

function readAccount(
  prefix: "E2E_AUTHOR" | "E2E_OTHER" | "E2E_ADMIN"
): E2EAccount | null {
  const email = process.env[`${prefix}_EMAIL`]?.trim();
  const password = process.env[`${prefix}_PASSWORD`];

  return email && password ? { email, password } : null;
}

export const AUTHOR_ACCOUNT = readAccount("E2E_AUTHOR");
export const OTHER_ACCOUNT = readAccount("E2E_OTHER");
export const ADMIN_ACCOUNT = readAccount("E2E_ADMIN");
export const OTHER_USER_ID = process.env.E2E_OTHER_USER_ID?.trim() || null;
export const MENTION_QUERY = process.env.E2E_MENTION_QUERY?.trim() || null;
export const MENTION_EXPECTED_NAME = process.env.E2E_MENTION_EXPECTED_NAME?.trim() || null;
export const MUTATING_E2E_ENABLED = process.env.E2E_ENABLE_MUTATIONS === "true";

export function uniqueTitle(subject: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `[E2E] ${subject} ${suffix}`;
}

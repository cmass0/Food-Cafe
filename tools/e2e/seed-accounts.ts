// E2E 테스트 계정을 로컬 Supabase에 만든다. 여러 번 실행해도 같은 상태가 된다.
// 계정 이메일·비밀번호는 .env.e2e.local(Git 제외)에서만 읽고, 로컬이 아닌 DB에는 실행하지 않는다.
//   npx tsx tools/e2e/seed-accounts.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: ".env.e2e.local", quiet: true });

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const DEFAULT_LOCAL_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

type AccountSpec = {
  prefix: "E2E_AUTHOR" | "E2E_OTHER" | "E2E_ADMIN";
  displayName: string;
  // 프로필 URL을 고정해야 하는 계정만 ID를 정한다.
  fixedId?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}이 .env.e2e.local에 필요합니다.`);
  return value;
}

function assertLocal(url: string, label: string) {
  const { hostname } = new URL(url);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `${label}이 로컬 주소가 아닙니다(${hostname}). 원격 DB에는 테스트 계정을 만들지 않습니다.`
    );
  }
}

async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) return null;
  }
}

async function upsertAccount(admin: SupabaseClient, spec: AccountSpec): Promise<string> {
  const email = requireEnv(`${spec.prefix}_EMAIL`);
  const password = requireEnv(`${spec.prefix}_PASSWORD`);
  const attributes = {
    password,
    email_confirm: true,
    user_metadata: { display_name: spec.displayName },
  };

  const existingId = await findUserIdByEmail(admin, email);
  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, attributes);
    if (error) throw error;
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    ...attributes,
    email,
    ...(spec.fixedId ? { id: spec.fixedId } : {}),
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const dbUrl = process.env.E2E_DB_URL?.trim() || DEFAULT_LOCAL_DB_URL;
  assertLocal(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
  assertLocal(dbUrl.replace(/^postgres(ql)?:/, "http:"), "E2E_DB_URL");

  const admin = createClient(supabaseUrl, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const otherId = requireEnv("E2E_OTHER_USER_ID");
  const mentionName = requireEnv("E2E_MENTION_EXPECTED_NAME");

  const authorId = await upsertAccount(admin, { prefix: "E2E_AUTHOR", displayName: "e2e-author" });
  const actualOtherId = await upsertAccount(admin, {
    prefix: "E2E_OTHER",
    displayName: mentionName,
    fixedId: otherId,
  });
  const adminId = await upsertAccount(admin, { prefix: "E2E_ADMIN", displayName: "e2e-admin" });

  if (actualOtherId !== otherId) {
    throw new Error(
      "E2E_OTHER 계정이 이미 다른 ID로 있습니다. 로컬 DB를 초기화한 뒤 다시 실행하세요."
    );
  }

  const db = new Client({ connectionString: dbUrl });
  await db.connect();
  try {
    // 관리자 역할은 API로 노출하지 않는 private 스키마라 SQL로 지정한다.
    await db.query(
      `insert into private.user_roles (user_id, role) values ($1, 'admin')
       on conflict (user_id) do update set role = excluded.role`,
      [adminId]
    );
    // 에디터 멘션 후보는 팔로잉 목록이므로 작성자가 다른 사용자를 팔로우해 둔다.
    await db.query(
      `insert into public.user_follows (follower_id, following_id) values ($1, $2)
       on conflict do nothing`,
      [authorId, otherId]
    );
  } finally {
    await db.end();
  }

  console.log(
    "E2E 계정 준비 완료: 작성자·다른 사용자·관리자, 관리자 역할, 작성자 → 다른 사용자 팔로우"
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

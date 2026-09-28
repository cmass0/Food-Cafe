import { expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 로컬 Supabase는 메일을 밖으로 보내지 않고 Mailpit이 받는다. 로컬 주소가 아니면 쓰지 않는다.
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function localUrl(value: string, label: string): URL {
  const url = new URL(value);
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(`${label}이 로컬 주소가 아닙니다(${url.hostname}).`);
  }
  return url;
}

const MAILPIT_URL = localUrl(
  process.env.E2E_MAILPIT_URL?.trim() || "http://127.0.0.1:54324",
  "E2E_MAILPIT_URL"
);

type MailpitSummary = { ID: string; Created: string; To: { Address: string }[] };

async function mailpit<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(new URL(path, MAILPIT_URL), init);
  if (!response.ok) throw new Error(`Mailpit ${path} 응답 ${response.status}`);
  return (await response.json()) as T;
}

export async function clearMailbox(email: string): Promise<void> {
  const query = encodeURIComponent(`to:"${email}"`);
  await fetch(new URL(`/api/v1/search?query=${query}`, MAILPIT_URL), { method: "DELETE" });
}

// 요청 이후 해당 주소로 온 가장 최근 메일에서 Supabase 인증 링크를 꺼낸다.
export async function waitForAuthLink(email: string, since: Date): Promise<string> {
  const query = encodeURIComponent(`to:"${email}"`);
  let messageId: string | undefined;

  await expect
    .poll(
      async () => {
        const { messages } = await mailpit<{ messages: MailpitSummary[] }>(
          `/api/v1/search?query=${query}`
        );
        messageId = messages.find((message) => new Date(message.Created) >= since)?.ID;
        return messageId;
      },
      { timeout: 30_000, message: `${email}로 온 메일을 찾지 못했습니다.` }
    )
    .toBeTruthy();

  const message = await mailpit<{ HTML: string; Text: string }>(`/api/v1/message/${messageId}`);
  const link = `${message.HTML}\n${message.Text}`
    .replaceAll("&amp;", "&")
    .match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/)?.[0];
  if (!link) throw new Error("메일에서 인증 링크를 찾지 못했습니다.");
  return link;
}

// 테스트가 바꾼 비밀번호를 원래 값으로 되돌린다. 로컬 Supabase의 서비스 키로만 실행한다.
export async function restorePassword(email: string, password: string): Promise<void> {
  const supabaseUrl = localUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    "NEXT_PUBLIC_SUPABASE_URL"
  ).toString();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userId = await findUserIdByEmail(admin, email);
  if (!userId) throw new Error(`${email} 계정을 찾지 못했습니다.`);

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
  if (updateError) throw updateError;
}

// 사용자가 많아도 복원 대상을 놓치지 않도록 모든 페이지를 순회한다.
async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const perPage = 200;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found.id;
    if (data.users.length < perPage) return null;
  }
}

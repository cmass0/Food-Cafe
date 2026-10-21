import "server-only";

import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { MAX_DAILY_CALLS_ANONYMOUS, MAX_DAILY_CALLS_SIGNED_IN } from "./limits";

type AdminClient = SupabaseClient<Database>;

export type RecommendChatSubject = {
  key: string;
  limit: number;
  signedIn: boolean;
};

// 로그인 사용자는 사용자 ID로, 비로그인은 IP로 센다. IP를 알 수 없는 요청은 한 묶음으로 센다.
// IP는 개인정보라 DB에 그대로 남기지 않고 서버 비밀값으로 HMAC을 만들어 저장한다.
export function resolveRecommendChatSubject(
  userId: string | null,
  ipKey: string | null
): RecommendChatSubject {
  if (userId) return { key: `user:${userId}`, limit: MAX_DAILY_CALLS_SIGNED_IN, signedIn: true };
  return {
    key: `ip:${hashIpKey(ipKey ?? "unknown")}`,
    limit: MAX_DAILY_CALLS_ANONYMOUS,
    signedIn: false,
  };
}

function hashIpKey(ipKey: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("[recommend] Missing SUPABASE_SERVICE_ROLE_KEY");
  return createHmac("sha256", secret).update(ipKey).digest("hex").slice(0, 32);
}

// 오늘 횟수가 남았으면 1을 쓰고 남은 횟수를, 다 썼으면 null을 돌려준다. 서버 전용 RPC(service_role)로만 센다.
export async function consumeRecommendChatCall(admin: AdminClient, subject: RecommendChatSubject) {
  const { data, error } = await admin.rpc("use_recommend_chat_call", {
    p_subject: subject.key,
    p_max_calls: subject.limit,
  });
  if (error) throw error;
  return data;
}

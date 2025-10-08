import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

// DB 레이어에서 사용할 Supabase 타입 헬퍼
export type UserRow = Tables<"users">;
export type UserInsertDB = TablesInsert<"users">;
export type UserUpdateDB = TablesUpdate<"users">;
export type UserSupabaseClient = SupabaseClient<Database>;

// 도메인 계층에서 사용할 사용자 모델 (필요한 필드만 camelCase로 정의)
export interface User {
  id: string;
  email: string | null;
  displayName: string;
  photoUrl: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserListResult {
  items: User[];
  nextCursor: string | null;
}

// 프로필 업데이트 입력(서비스/컨트롤러에서 사용)
export type UserUpdate = {
  display_name?: string | null;
  photo_url?: string | null;
};

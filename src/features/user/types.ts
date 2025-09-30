export type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type UserUpdate = {
  display_name?: string | null;
  avatar_url?: string | null;
};


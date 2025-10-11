export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string
          parent_type: Database["public"]["Enums"]["comment_parent_type"]
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id: string
          parent_type: Database["public"]["Enums"]["comment_parent_type"]
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string
          parent_type?: Database["public"]["Enums"]["comment_parent_type"]
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          comment_count: number
          created_at: string
          id: string
          like_count: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          comment_count?: number
          created_at?: string
          id?: string
          like_count?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          comment_count?: number
          created_at?: string
          id?: string
          like_count?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string | null
          created_at: string
          id: string
          id_text_old: string
          image: string | null
          images: string[]
          last_liked_at: string | null
          legacy_id: string | null
          like_count: number
          recipe: string | null
          status: number | null
          summary: string | null
          tags: string[]
          title: string
          tsv: unknown | null
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
          writer_uid_legacy: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          id_text_old: string
          image?: string | null
          images?: string[]
          last_liked_at?: string | null
          legacy_id?: string | null
          like_count?: number
          recipe?: string | null
          status?: number | null
          summary?: string | null
          tags?: string[]
          title: string
          tsv?: unknown | null
          updated_at?: string
          view_count?: number
          writer_email?: string | null
          writer_name?: string | null
          writer_uid?: string | null
          writer_uid_legacy?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          id_text_old?: string
          image?: string | null
          images?: string[]
          last_liked_at?: string | null
          legacy_id?: string | null
          like_count?: number
          recipe?: string | null
          status?: number | null
          summary?: string | null
          tags?: string[]
          title?: string
          tsv?: unknown | null
          updated_at?: string
          view_count?: number
          writer_email?: string | null
          writer_name?: string | null
          writer_uid?: string | null
          writer_uid_legacy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_writer_fk"
            columns: ["writer_uid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_likes: {
        Row: {
          created_at: string | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_admin: boolean | null
          photo_url: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_admin?: boolean | null
          photo_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_admin?: boolean | null
          photo_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      post_adjust_like: {
        Args: { p_delta: number; p_post_id: string }
        Returns: {
          author_id: string
          body: string
          comment_count: number
          created_at: string
          id: string
          like_count: number
          tags: string[]
          title: string
          updated_at: string
        }
      }
      recipe_adjust_like: {
        Args: { p_delta: number; p_recipe_id: string }
        Returns: {
          category: string | null
          created_at: string
          id: string
          id_text_old: string
          image: string | null
          images: string[]
          last_liked_at: string | null
          legacy_id: string | null
          like_count: number
          recipe: string | null
          status: number | null
          summary: string | null
          tags: string[]
          title: string
          tsv: unknown | null
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
          writer_uid_legacy: string | null
        }
      }
      recipe_increment_view: {
        Args: { p_recipe_id: string }
        Returns: {
          category: string | null
          created_at: string
          id: string
          id_text_old: string
          image: string | null
          images: string[]
          last_liked_at: string | null
          legacy_id: string | null
          like_count: number
          recipe: string | null
          status: number | null
          summary: string | null
          tags: string[]
          title: string
          tsv: unknown | null
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
          writer_uid_legacy: string | null
        }
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      uuid_v7: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      comment_parent_type: "recipe" | "post"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      comment_parent_type: ["recipe", "post"],
    },
  },
} as const

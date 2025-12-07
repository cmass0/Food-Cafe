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
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string
          parent_type: Database["public"]["Enums"]["comment_parent_type"]
          updated_at: string
          writer_name: string
          writer_uid: string | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id: string
          parent_type: Database["public"]["Enums"]["comment_parent_type"]
          updated_at?: string
          writer_name?: string
          writer_uid?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string
          parent_type?: Database["public"]["Enums"]["comment_parent_type"]
          updated_at?: string
          writer_name?: string
          writer_uid?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          comment_count: number
          content: string
          created_at: string
          id: string
          like_count: number
          number: number
          tags: string[]
          title: string
          type: string
          updated_at: string
          view_count: number
          writer_name: string
          writer_uid: string
        }
        Insert: {
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          like_count?: number
          number?: number
          tags?: string[]
          title: string
          type?: string
          updated_at?: string
          view_count?: number
          writer_name?: string
          writer_uid: string
        }
        Update: {
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          like_count?: number
          number?: number
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          view_count?: number
          writer_name?: string
          writer_uid?: string
        }
        Relationships: []
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
          tsv: unknown
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
          image?: string | null
          last_liked_at?: string | null
          like_count?: number
          recipe?: string | null
          status?: number | null
          summary?: string | null
          tags?: string[]
          title: string
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_email?: string | null
          writer_name?: string | null
          writer_uid?: string | null
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
          tsv?: unknown
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
          {
            foreignKeyName: "recipes_writer_fk"
            columns: ["writer_uid"]
            isOneToOne: false
            referencedRelation: "users_public"
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
          {
            foreignKeyName: "user_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_public"
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
      users_public: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string | null
          photo_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          photo_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_post_view_count: {
        Args: { target: string }
        Returns: undefined
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      post_adjust_like: {
        Args: { p_delta: number; p_post_id: string }
        Returns: {
          comment_count: number
          content: string
          created_at: string
          id: string
          like_count: number
          number: number
          tags: string[]
          title: string
          type: string
          updated_at: string
          view_count: number
          writer_name: string
          writer_uid: string
        }
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: true
          isSetofReturn: false
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
          tsv: unknown
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
          writer_uid_legacy: string | null
        }
        SetofOptions: {
          from: "*"
          to: "recipes"
          isOneToOne: true
          isSetofReturn: false
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
          tsv: unknown
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
          writer_uid_legacy: string | null
        }
        SetofOptions: {
          from: "*"
          to: "recipes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      uuid_v7: { Args: never; Returns: string }
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


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
      combo_bookmarks: {
        Row: {
          combo_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          combo_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          combo_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_bookmarks_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_likes: {
        Row: {
          combo_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          combo_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          combo_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_likes_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_recipe_ref: {
        Row: {
          combo_id: string
          created_at: string
          note: string | null
          recipe_id: string
          sort_order: number
        }
        Insert: {
          combo_id: string
          created_at?: string
          note?: string | null
          recipe_id: string
          sort_order?: number
        }
        Update: {
          combo_id?: string
          created_at?: string
          note?: string | null
          recipe_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_recipe_ref_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_recipe_ref_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      combos: {
        Row: {
          bookmark_count: number
          comment_count: number
          created_at: string
          difficulty: string | null
          id: string
          image: string | null
          items: Json
          like_count: number
          steps: Json | null
          summary: string | null
          tags: string[]
          time_minutes: number | null
          title: string
          tools_required: boolean
          updated_at: string
          view_count: number
          writer_name: string | null
          writer_uid: string | null
        }
        Insert: {
          bookmark_count?: number
          comment_count?: number
          created_at?: string
          difficulty?: string | null
          id?: string
          image?: string | null
          items?: Json
          like_count?: number
          steps?: Json | null
          summary?: string | null
          tags?: string[]
          time_minutes?: number | null
          title: string
          tools_required?: boolean
          updated_at?: string
          view_count?: number
          writer_name?: string | null
          writer_uid?: string | null
        }
        Update: {
          bookmark_count?: number
          comment_count?: number
          created_at?: string
          difficulty?: string | null
          id?: string
          image?: string | null
          items?: Json
          like_count?: number
          steps?: Json | null
          summary?: string | null
          tags?: string[]
          time_minutes?: number | null
          title?: string
          tools_required?: boolean
          updated_at?: string
          view_count?: number
          writer_name?: string | null
          writer_uid?: string | null
        }
        Relationships: []
      }
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
      recipe_bookmarks: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_likes: {
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
      recipes: {
        Row: {
          bookmark_count: number
          category: string | null
          created_at: string
          difficulty: string | null
          id: string
          image: string | null
          ingredients: Json
          last_liked_at: string | null
          like_count: number
          servings: number | null
          steps: Json
          summary: string | null
          tags: string[]
          time_minutes: number | null
          title: string
          tsv: unknown
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
        }
        Insert: {
          bookmark_count?: number
          category?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          image?: string | null
          ingredients?: Json
          last_liked_at?: string | null
          like_count?: number
          servings?: number | null
          steps: Json
          summary?: string | null
          tags?: string[]
          time_minutes?: number | null
          title: string
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_email?: string | null
          writer_name?: string | null
          writer_uid?: string | null
        }
        Update: {
          bookmark_count?: number
          category?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          image?: string | null
          ingredients?: Json
          last_liked_at?: string | null
          like_count?: number
          servings?: number | null
          steps?: Json
          summary?: string | null
          tags?: string[]
          time_minutes?: number | null
          title?: string
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_email?: string | null
          writer_name?: string | null
          writer_uid?: string | null
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
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
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
          email: string
          follower_count: number
          following_count: number
          id: string
          is_admin: boolean | null
          last_sign_in_at: string | null
          photo_url: string | null
          provider: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at: string
          display_name: string
          email: string
          follower_count?: number
          following_count?: number
          id?: string
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          photo_url?: string | null
          provider?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          follower_count?: number
          following_count?: number
          id?: string
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          photo_url?: string | null
          provider?: string | null
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
      combo_toggle_like: {
        Args: { p_combo_id: string }
        Returns: {
          like_count: number
          liked: boolean
        }[]
      }
      get_top_recipes_by_recent_likes: {
        Args: { limit_size?: number; term: string }
        Returns: {
          created_at: string
          image: string
          like_count: number
          like_delta: number
          recipe_id: string
          summary: string
          title: string
          view_count: number
          writer_name: string
          writer_uid: string
        }[]
      }
      increment_combo_view: { Args: { p_combo_id: string }; Returns: number }
      increment_post_view: { Args: { p_post_id: string }; Returns: number }
      increment_recipe_view: {
        Args: { p_recipe_id: string }
        Returns: {
          bookmark_count: number
          category: string | null
          created_at: string
          difficulty: string | null
          id: string
          image: string | null
          ingredients: Json
          last_liked_at: string | null
          like_count: number
          servings: number | null
          steps: Json
          summary: string | null
          tags: string[]
          time_minutes: number | null
          title: string
          tsv: unknown
          updated_at: string
          view_count: number
          writer_email: string | null
          writer_name: string | null
          writer_uid: string | null
        }
        SetofOptions: {
          from: "*"
          to: "recipes"
          isOneToOne: true
          isSetofReturn: false
        }
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
      recipe_toggle_like: {
        Args: { p_recipe_id: string }
        Returns: {
          like_count: number
          liked: boolean
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_bookmark: {
        Args: { p_id: string; p_type: string }
        Returns: {
          bookmark_count: number
          bookmarked: boolean
        }[]
      }
      toggle_follow: { Args: { p_target_id: string }; Returns: boolean }
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

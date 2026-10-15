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
          tools: string[] | null
          tools_required: boolean
          tsv: unknown
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
          tools?: string[] | null
          tools_required?: boolean
          tsv?: unknown
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
          tools?: string[] | null
          tools_required?: boolean
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_name?: string | null
          writer_uid?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          combo_id: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          post_id: string | null
          recipe_id: string | null
          updated_at: string
          writer_name: string
          writer_uid: string | null
        }
        Insert: {
          combo_id?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id?: string | null
          recipe_id?: string | null
          updated_at?: string
          writer_name?: string
          writer_uid?: string | null
        }
        Update: {
          combo_id?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id?: string | null
          recipe_id?: string | null
          updated_at?: string
          writer_name?: string
          writer_uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          bookmark_count: number
          category: string
          comment_count: number
          content_html: string | null
          content_json: Json | null
          content_text: string | null
          created_at: string
          id: string
          like_count: number
          number: number
          tags: string[]
          title: string
          tsv: unknown
          updated_at: string
          view_count: number
          writer_name: string
          writer_uid: string
        }
        Insert: {
          bookmark_count?: number
          category?: string
          comment_count?: number
          content_html?: string | null
          content_json?: Json | null
          content_text?: string | null
          created_at?: string
          id?: string
          like_count?: number
          number?: number
          tags?: string[]
          title: string
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_name?: string
          writer_uid: string
        }
        Update: {
          bookmark_count?: number
          category?: string
          comment_count?: number
          content_html?: string | null
          content_json?: Json | null
          content_text?: string | null
          created_at?: string
          id?: string
          like_count?: number
          number?: number
          tags?: string[]
          title?: string
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_name?: string
          writer_uid?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          follower_count: number
          following_count: number
          id: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          follower_count?: number
          following_count?: number
          id: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          follower_count?: number
          following_count?: number
          id?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_bookmarks: {
        Row: {
          created_at: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_bookmarks_recipe_id_fkey"
            columns: ["recipe_id"]
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
            foreignKeyName: "recipe_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          bookmark_count: number
          category: string | null
          chef_tip: string | null
          comment_count: number
          created_at: string
          difficulty: string | null
          id: string
          image: string | null
          images: string[]
          ingredients: Json
          last_liked_at: string | null
          like_count: number
          servings: number | null
          steps: Json
          summary: string | null
          tags: string[]
          time_minutes: number | null
          title: string
          tools: string[] | null
          tools_required: boolean
          tsv: unknown
          updated_at: string
          view_count: number
          writer_name: string | null
          writer_uid: string | null
        }
        Insert: {
          bookmark_count?: number
          category?: string | null
          chef_tip?: string | null
          comment_count?: number
          created_at?: string
          difficulty?: string | null
          id?: string
          image?: string | null
          images?: string[]
          ingredients?: Json
          last_liked_at?: string | null
          like_count?: number
          servings?: number | null
          steps: Json
          summary?: string | null
          tags?: string[]
          time_minutes?: number | null
          title: string
          tools?: string[] | null
          tools_required?: boolean
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_name?: string | null
          writer_uid?: string | null
        }
        Update: {
          bookmark_count?: number
          category?: string | null
          chef_tip?: string | null
          comment_count?: number
          created_at?: string
          difficulty?: string | null
          id?: string
          image?: string | null
          images?: string[]
          ingredients?: Json
          last_liked_at?: string | null
          like_count?: number
          servings?: number | null
          steps?: Json
          summary?: string | null
          tags?: string[]
          time_minutes?: number | null
          title?: string
          tools?: string[] | null
          tools_required?: boolean
          tsv?: unknown
          updated_at?: string
          view_count?: number
          writer_name?: string | null
          writer_uid?: string | null
        }
        Relationships: []
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_writing_assistant_sessions_today: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_recommendation_document_states: {
        Args: never
        Returns: {
          content_hash: string
          embedding_model: string | null
          embedding_status: string
          source_id: string
          source_type: string
        }[]
      }
      get_personalized_recommendations: {
        Args: {
          p_embedding_model_id: string
          p_items: Json
          p_match_count?: number
          p_source_types?: string[]
          p_user_id?: string
        }
        Returns: {
          similarity: number
          source_id: string
          source_type: "combo" | "recipe"
        }[]
      }
      get_popular_recommendations: {
        Args: { p_limit?: number }
        Returns: {
          last_recommended_at: string
          recommendation_count: number
          source_id: string
          source_type: "combo" | "recipe"
        }[]
      }
      get_popular_recommendations_30d: {
        Args: { p_limit?: number }
        Returns: {
          last_recommended_at: string
          recommendation_count: number
          source_id: string
          source_type: "combo" | "recipe"
        }[]
      }
      get_trending_combos: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          bookmark_count: number
          comment_count: number
          created_at: string
          id: string
          image: string
          last_activity_at: string
          like_count: number
          recent_activity_count: number
          recent_bookmark_count: number
          recent_comment_count: number
          recent_like_count: number
          recent_participant_count: number
          summary: string
          tags: string[]
          title: string
          trend_score: number
          view_count: number
          writer_name: string
          writer_uid: string
        }[]
      }
      get_trending_posts: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          bookmark_count: number
          comment_count: number
          created_at: string
          id: string
          image: string
          last_activity_at: string
          like_count: number
          recent_activity_count: number
          recent_bookmark_count: number
          recent_comment_count: number
          recent_like_count: number
          recent_participant_count: number
          summary: string
          tags: string[]
          title: string
          trend_score: number
          view_count: number
          writer_name: string
          writer_uid: string
        }[]
      }
      get_trending_recipe_tags: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          last_activity_at: string
          recent_activity_count: number
          recent_bookmark_count: number
          recent_comment_count: number
          recent_like_count: number
          recent_participant_count: number
          recent_recipe_count: number
          tag: string
          total_recipe_count: number
          trend_score: number
        }[]
      }
      get_trending_recipes: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          bookmark_count: number
          comment_count: number
          created_at: string
          id: string
          image: string
          last_activity_at: string
          like_count: number
          recent_activity_count: number
          recent_bookmark_count: number
          recent_comment_count: number
          recent_like_count: number
          recent_participant_count: number
          summary: string
          tags: string[]
          title: string
          trend_score: number
          view_count: number
          writer_name: string
          writer_uid: string
        }[]
      }
      increment_combo_view: { Args: { p_combo_id: string }; Returns: number }
      increment_post_view: { Args: { p_post_id: string }; Returns: number }
      increment_recommendation_counts: {
        Args: { p_combo_ids?: string[]; p_recipe_ids?: string[] }
        Returns: undefined
      }
      increment_recipe_view: { Args: { p_recipe_id: string }; Returns: number }
      is_current_user_admin: { Args: never; Returns: boolean }
      refund_writing_assistant_call: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: undefined
      }
      search_recommendations: {
        Args: {
          p_category?: string | null
          p_difficulty?: string | null
          p_embedding_model_id: string
          p_exclude_ingredients?: string[] | null
          p_include_ingredients?: string[] | null
          p_match_count?: number
          p_max_time_minutes?: number | null
          p_query_embedding: number[]
          p_query_text: string
          p_source_types?: string[] | null
          p_tools_required?: boolean | null
        }
        Returns: {
          keyword_rank: number | null
          score: number
          semantic_rank: number | null
          semantic_similarity: number | null
          source_id: string
          source_type: "combo" | "recipe"
        }[]
      }
      set_combo_bookmark: {
        Args: { p_combo_id: string; p_bookmarked: boolean }
        Returns: {
          bookmark_count: number
          bookmarked: boolean
        }[]
      }
      set_combo_like: {
        Args: { p_combo_id: string; p_liked: boolean }
        Returns: {
          like_count: number
          liked: boolean
        }[]
      }
      set_follow: {
        Args: { p_following: boolean; p_target_id: string }
        Returns: {
          follower_count: number
          following: boolean
          following_count: number
        }[]
      }
      set_post_bookmark: {
        Args: { p_post_id: string; p_bookmarked: boolean }
        Returns: {
          bookmark_count: number
          bookmarked: boolean
        }[]
      }
      set_post_like: {
        Args: { p_post_id: string; p_liked: boolean }
        Returns: {
          like_count: number
          liked: boolean
        }[]
      }
      set_recipe_bookmark: {
        Args: { p_recipe_id: string; p_bookmarked: boolean }
        Returns: {
          bookmark_count: number
          bookmarked: boolean
        }[]
      }
      set_recipe_like: {
        Args: { p_recipe_id: string; p_liked: boolean }
        Returns: {
          like_count: number
          liked: boolean
        }[]
      }
      start_writing_assistant_session: {
        Args: { p_max_sessions: number; p_user_id: string }
        Returns: string
      }
      upsert_recommendation_documents: {
        Args: { p_documents: Json }
        Returns: number
      }
      use_writing_assistant_call: {
        Args: { p_max_calls: number; p_session_id: string; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

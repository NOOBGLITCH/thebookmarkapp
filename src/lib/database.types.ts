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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          service: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          service: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          service?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookmark_shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          permission_level: string | null
          resource_id: string
          shared_by: string
          shared_with: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          resource_id: string
          shared_by: string
          shared_with?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          resource_id?: string
          shared_by?: string
          shared_with?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_shares_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmark_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmark_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_tags: {
        Row: {
          bookmark_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          bookmark_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          bookmark_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_tags_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmark_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          description: string | null
          favicon_url: string | null
          folder_id: string | null
          id: string
          is_public: boolean | null
          screenshot_url: string | null
          title: string | null
          updated_at: string | null
          url: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          favicon_url?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          screenshot_url?: string | null
          title?: string | null
          updated_at?: string | null
          url: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          favicon_url?: string | null
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          screenshot_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          permission_level: string | null
          resource_id: string
          shared_by: string
          shared_with: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          resource_id: string
          shared_by: string
          shared_with?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          resource_id?: string
          shared_by?: string
          shared_with?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folder_shares_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tag_shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          permission_level: string | null
          resource_id: string
          shared_by: string
          shared_with: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          resource_id: string
          shared_by: string
          shared_with?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission_level?: string | null
          resource_id?: string
          shared_by?: string
          shared_with?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_shares_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          name: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
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
      create_bookmark_share: {
        Args: {
          expires_at?: string
          permission_level?: string
          resource_id: string
        }
        Returns: {
          share_id: string
          token: string
        }[]
      }
      create_folder_share: {
        Args: {
          expires_at?: string
          permission_level?: string
          resource_id: string
        }
        Returns: {
          share_id: string
          token: string
        }[]
      }
      create_tag_share: {
        Args: {
          expires_at?: string
          permission_level?: string
          resource_id: string
        }
        Returns: {
          share_id: string
          token: string
        }[]
      }
      delete_bookmark_with_cleanup: {
        Args: { p_bookmark_id: string }
        Returns: undefined
      }
      export_bookmarks: {
        Args: { format?: string; scope?: string; scope_id?: string }
        Returns: Json
      }
      get_shared_bookmark: {
        Args: { token_input: string }
        Returns: {
          created_at: string
          description: string
          id: string
          owner_email: string
          title: string
          url: string
        }[]
      }
      get_shared_folder: { Args: { token_input: string }; Returns: Json }
      get_shared_tag: { Args: { token_input: string }; Returns: Json }
      import_bookmarks: { Args: { payload: Json }; Returns: Json }
      revoke_bookmark_share: {
        Args: { share_token: string }
        Returns: undefined
      }
      revoke_folder_share: { Args: { share_token: string }; Returns: undefined }
      revoke_tag_share: { Args: { share_token: string }; Returns: undefined }
      snapshot_bookmarks: { Args: never; Returns: Json }
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

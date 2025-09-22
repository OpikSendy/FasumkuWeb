// admin-panel/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string | null
          facility_id: number | null
          id: number
          text: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          facility_id?: number | null
          id?: number
          text: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          facility_id?: number | null
          id?: number
          text?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          address: string | null
          category_id: number | null
          created_at: string | null
          description: string | null
          facility_type_id: number | null
          id: number
          image_path: string | null
          is_early_accessible: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          address?: string | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          facility_type_id?: number | null
          id?: number
          image_path?: string | null
          is_early_accessible?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          address?: string | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          facility_type_id?: number | null
          id?: number
          image_path?: string | null
          is_early_accessible?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_facility_type_id_fkey"
            columns: ["facility_type_id"]
            isOneToOne: false
            referencedRelation: "facility_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_status_history: {
        Row: {
          changed_at: string | null
          changed_by: number | null
          created_at: string | null
          facility_id: number | null
          id: number
          notes: string | null
          status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: number | null
          created_at?: string | null
          facility_id?: number | null
          id?: number
          notes?: string | null
          status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: number | null
          created_at?: string | null
          facility_id?: number | null
          id?: number
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_status_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_types: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          category_id: number | null
          complaint_image_path: string | null
          created_at: string | null
          description: string | null
          id: number
          images: string[] | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          priority: string | null
          reported_by: number | null
          reports_date: string | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          category_id?: number | null
          complaint_image_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          images?: string[] | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          priority?: string | null
          reported_by?: number | null
          reports_date?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          category_id?: number | null
          complaint_image_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          images?: string[] | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          priority?: string | null
          reported_by?: number | null
          reports_date?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: number
          preference_key: string
          preference_value: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          preference_key: string
          preference_value: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          preference_key?: string
          preference_value?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: number
          is_phone_verified: boolean | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role_enum"] | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: number
          is_phone_verified?: boolean | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: number
          is_phone_verified?: boolean | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      report_facility: "Rendah" | "Sedang" | "Tinggi" | "Mendesak"
      report_status: "Baru" | "Menunggu" | "Diproses" | "Selesai"
      user_role: "user" | "admin"
      user_role_enum: "admin" | "user" | "moderator"
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
      report_facility: ["Normal", "Rendah", "Sedang", "Tinggi", "Mendesak"],
      report_status: ["Baru", "Menunggu", "Diproses", "Selesai"],
      user_role: ["user", "admin"],
      user_role_enum: ["admin", "user", "moderator"],
    },
  },
} as const


export type ReportFacilityPriority = Enums<'report_facility'>
export type ReportStatus = Enums<'report_status'>
export type UserRole = Enums<'user_role_enum'>

export type User = Tables<'users'>
export type Report = Tables<'reports'>
export type Category = Tables<'categories'>
export type Facility = Tables<'facilities'>
export type FacilityType = Tables<'facility_types'>
export type Comment = Tables<'comments'>
export type Notification = Tables<'notifications'>
export type UserPreference = Tables<'user_preferences'>
export type FacilityStatusHistory = Tables<'facility_status_history'>

// Insert types
export type CategoryInsert = TablesInsert<'categories'>
export type ReportInsert = TablesInsert<'reports'>
export type UserPreferenceInsert = TablesInsert<'user_preferences'>
export type UserInsert = TablesInsert<'users'>
export type FacilityStatusHistoryInsert = TablesInsert<'facility_status_history'>
export type FacilityInsert = TablesInsert<'facilities'>
export type FacilityTypeInsert = TablesInsert<'facility_types'>
export type CommentInsert = TablesInsert<'comments'>
export type NotificationInsert = TablesInsert<'notifications'>

// Update types
export type CategoryUpdate = TablesUpdate<'categories'>
export type ReportUpdate = TablesUpdate<'reports'>
export type UserPreferenceUpdate = TablesUpdate<'user_preferences'>
export type UserUpdate = TablesUpdate<'users'>
export type FacilityStatusHistoryUpdate = TablesUpdate<'facility_status_history'>
export type FacilityUpdate = TablesUpdate<'facilities'>
export type FacilityTypeUpdate = TablesUpdate<'facility_types'>
export type CommentUpdate = TablesUpdate<'comments'>
export type NotificationUpdate = TablesUpdate<'notifications'>

// Row only
export type FacilityWithRelationsShip = Facility & {
  users: User | null
  categories: Category | null
  facility_types: FacilityType | null
}

export type ReportWithRelations = Report & {
  user: User | null
  category: Category | null
  reported_by_user: User | null
}
export type ReportWithRelationsShip = Report & {
  user: User | null
  category: Category | null
}
export type ReportWithReporter = Report & {
  reported_by_user: User | null
}
export type CommentWithUser = Comment & {
  users: User | null
}
export type NotificationWithUser = Notification & {
  users: User | null
}

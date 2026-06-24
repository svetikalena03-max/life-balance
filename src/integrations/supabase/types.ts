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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_entries: {
        Row: {
          afternoon_snack: Json | null
          bread_crisps_count: number | null
          breakfast_1: Json | null
          breakfast_2: Json | null
          coffee_ml: number | null
          created_at: string
          date: string
          dinner: Json | null
          extra_meals: Json | null
          id: string
          juice_ml: number | null
          late_snack: Json | null
          lunch: Json | null
          milk_or_cream: boolean | null
          mood: number | null
          other_drinks: string | null
          sleep_hours: number | null
          snack: Json | null
          soda_ml: number | null
          steps: number | null
          sugar: string | null
          sugar_other: string | null
          tea_ml: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
          weight: number | null
          wellbeing: string | null
          workout: string | null
          workout_minutes: number | null
        }
        Insert: {
          afternoon_snack?: Json | null
          bread_crisps_count?: number | null
          breakfast_1?: Json | null
          breakfast_2?: Json | null
          coffee_ml?: number | null
          created_at?: string
          date: string
          dinner?: Json | null
          extra_meals?: Json | null
          id?: string
          juice_ml?: number | null
          late_snack?: Json | null
          lunch?: Json | null
          milk_or_cream?: boolean | null
          mood?: number | null
          other_drinks?: string | null
          sleep_hours?: number | null
          snack?: Json | null
          soda_ml?: number | null
          steps?: number | null
          sugar?: string | null
          sugar_other?: string | null
          tea_ml?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
          weight?: number | null
          wellbeing?: string | null
          workout?: string | null
          workout_minutes?: number | null
        }
        Update: {
          afternoon_snack?: Json | null
          bread_crisps_count?: number | null
          breakfast_1?: Json | null
          breakfast_2?: Json | null
          coffee_ml?: number | null
          created_at?: string
          date?: string
          dinner?: Json | null
          extra_meals?: Json | null
          id?: string
          juice_ml?: number | null
          late_snack?: Json | null
          lunch?: Json | null
          milk_or_cream?: boolean | null
          mood?: number | null
          other_drinks?: string | null
          sleep_hours?: number | null
          snack?: Json | null
          soda_ml?: number | null
          steps?: number | null
          sugar?: string | null
          sugar_other?: string | null
          tea_ml?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
          weight?: number | null
          wellbeing?: string | null
          workout?: string | null
          workout_minutes?: number | null
        }
        Relationships: []
      }
      habits: {
        Row: {
          alcohol: string | null
          coffee_ml: number | null
          coffee_per_day: string | null
          created_at: string
          energy_drinks: string | null
          fast_food: string | null
          id: string
          night_snacks: string | null
          screen_time: string | null
          smoking: string | null
          stress_level: string | null
          sweets: string | null
          tea_cups: number | null
          tea_ml: number | null
          tea_sugar: string | null
          updated_at: string
          user_id: string
          usual_steps: number | null
          vape: string | null
        }
        Insert: {
          alcohol?: string | null
          coffee_ml?: number | null
          coffee_per_day?: string | null
          created_at?: string
          energy_drinks?: string | null
          fast_food?: string | null
          id?: string
          night_snacks?: string | null
          screen_time?: string | null
          smoking?: string | null
          stress_level?: string | null
          sweets?: string | null
          tea_cups?: number | null
          tea_ml?: number | null
          tea_sugar?: string | null
          updated_at?: string
          user_id: string
          usual_steps?: number | null
          vape?: string | null
        }
        Update: {
          alcohol?: string | null
          coffee_ml?: number | null
          coffee_per_day?: string | null
          created_at?: string
          energy_drinks?: string | null
          fast_food?: string | null
          id?: string
          night_snacks?: string | null
          screen_time?: string | null
          smoking?: string | null
          stress_level?: string | null
          sweets?: string | null
          tea_cups?: number | null
          tea_ml?: number | null
          tea_sugar?: string | null
          updated_at?: string
          user_id?: string
          usual_steps?: number | null
          vape?: string | null
        }
        Relationships: []
      }
      health_entries: {
        Row: {
          back_pain: boolean | null
          bloating: boolean | null
          created_at: string
          date: string
          diastolic_pressure: number | null
          energy: number | null
          health_comment: string | null
          heartburn: boolean | null
          id: string
          knee_pain: boolean | null
          pulse: number | null
          stress: boolean | null
          swelling: boolean | null
          systolic_pressure: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back_pain?: boolean | null
          bloating?: boolean | null
          created_at?: string
          date: string
          diastolic_pressure?: number | null
          energy?: number | null
          health_comment?: string | null
          heartburn?: boolean | null
          id?: string
          knee_pain?: boolean | null
          pulse?: number | null
          stress?: boolean | null
          swelling?: boolean | null
          systolic_pressure?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back_pain?: boolean | null
          bloating?: boolean | null
          created_at?: string
          date?: string
          diastolic_pressure?: number | null
          energy?: number | null
          health_comment?: string | null
          heartburn?: boolean | null
          id?: string
          knee_pain?: boolean | null
          pulse?: number | null
          stress?: boolean | null
          swelling?: boolean | null
          systolic_pressure?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_features: {
        Row: {
          chronic_conditions: string[] | null
          chronic_other: string | null
          comment: string | null
          created_at: string
          doctor_recommendations: string | null
          food_intolerances: string | null
          gi_issues: string[] | null
          has_doctor_rec: boolean | null
          id: string
          medications: string | null
          movement_limitations: string[] | null
          takes_meds: boolean | null
          updated_at: string
          user_id: string
          women_health: string[] | null
          workout_limits: string[] | null
        }
        Insert: {
          chronic_conditions?: string[] | null
          chronic_other?: string | null
          comment?: string | null
          created_at?: string
          doctor_recommendations?: string | null
          food_intolerances?: string | null
          gi_issues?: string[] | null
          has_doctor_rec?: boolean | null
          id?: string
          medications?: string | null
          movement_limitations?: string[] | null
          takes_meds?: boolean | null
          updated_at?: string
          user_id: string
          women_health?: string[] | null
          workout_limits?: string[] | null
        }
        Update: {
          chronic_conditions?: string[] | null
          chronic_other?: string | null
          comment?: string | null
          created_at?: string
          doctor_recommendations?: string | null
          food_intolerances?: string | null
          gi_issues?: string[] | null
          has_doctor_rec?: boolean | null
          id?: string
          medications?: string | null
          movement_limitations?: string[] | null
          takes_meds?: boolean | null
          updated_at?: string
          user_id?: string
          women_health?: string[] | null
          workout_limits?: string[] | null
        }
        Relationships: []
      }
      legal_consents: {
        Row: {
          accepted_at: string
          document_version: string | null
          id: string
          medical_disclaimer_accepted: boolean
          personal_data_accepted: boolean
          privacy_policy_accepted: boolean
          user_agreement_accepted: boolean
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_version?: string | null
          id?: string
          medical_disclaimer_accepted?: boolean
          personal_data_accepted?: boolean
          privacy_policy_accepted?: boolean
          user_agreement_accepted?: boolean
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_version?: string | null
          id?: string
          medical_disclaimer_accepted?: boolean
          personal_data_accepted?: boolean
          privacy_policy_accepted?: boolean
          user_agreement_accepted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          birth_date: string | null
          created_at: string
          current_weight: number | null
          email: string | null
          gender: string | null
          goal: string | null
          height: number | null
          id: string
          name: string | null
          target_weight: number | null
          updated_at: string
          user_id: string
          water_goal: number | null
        }
        Insert: {
          age?: number | null
          birth_date?: string | null
          created_at?: string
          current_weight?: number | null
          email?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          name?: string | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
          water_goal?: number | null
        }
        Update: {
          age?: number | null
          birth_date?: string | null
          created_at?: string
          current_weight?: number | null
          email?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          name?: string | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          water_goal?: number | null
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

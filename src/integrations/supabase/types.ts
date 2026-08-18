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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_tutor_usage: {
        Row: {
          count: number
          created_at: string
          id: string
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      battles: {
        Row: {
          id: string
          created_by: string
          opponent_id: string | null
          status: string
          scores: Json
          questions_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          opponent_id?: string | null
          status?: string
          scores?: Json
          questions_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          opponent_id?: string | null
          status?: string
          scores?: Json
          questions_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cta_events: {
        Row: {
          created_at: string
          event: string
          id: string
          path: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      level_progress: {
        Row: {
          created_at: string
          gems_earned: number
          id: string
          is_completed: boolean
          level_id: number
          score_correct: number
          score_total: number
          unit_id: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          gems_earned?: number
          id?: string
          is_completed?: boolean
          level_id: number
          score_correct?: number
          score_total?: number
          unit_id: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          gems_earned?: number
          id?: string
          is_completed?: boolean
          level_id?: number
          score_correct?: number
          score_total?: number
          unit_id?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          is_unlocked: boolean
          jump_test_failed_at: string | null
          module: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          is_unlocked?: boolean
          jump_test_failed_at?: string | null
          module: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          is_unlocked?: boolean
          jump_test_failed_at?: string | null
          module?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
        profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_level: string | null
          daily_minutes: number | null
          daily_xp_target: number | null
          diagnostic_score: number | null
          display_name: string
          id: string
          initial_level: string | null
          intensity: string | null
          is_premium: boolean
          nickname: string | null
          onboarding_completed: boolean | null
          sat_goal: string | null
          target_score: number | null
          updated_at: string
          user_id: string
          referral_source: string | null
          streak_days: number
          weekly_xp: number
          league: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_level?: string | null
          daily_minutes?: number | null
          daily_xp_target?: number | null
          diagnostic_score?: number | null
          display_name?: string
          id?: string
          initial_level?: string | null
          intensity?: string | null
          is_premium?: boolean
          nickname?: string | null
          onboarding_completed?: boolean | null
          sat_goal?: string | null
          target_score?: number | null
          updated_at?: string
          user_id: string
          referral_source?: string | null
          streak_days?: number
          weekly_xp?: number
          league?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_level?: string | null
          daily_minutes?: number | null
          daily_xp_target?: number | null
          diagnostic_score?: number | null
          display_name?: string
          id?: string
          initial_level?: string | null
          intensity?: string | null
          is_premium?: boolean
          nickname?: string | null
          onboarding_completed?: boolean | null
          sat_goal?: string | null
          target_score?: number | null
          updated_at?: string
          user_id?: string
          referral_source?: string | null
          streak_days?: number
          weekly_xp?: number
          league?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          correct_answer: number
          created_at: string
          difficulty: number
          explanation: string | null
          id: string
          module: number
          options: Json
          question_text: string
          topic: string
        }
        Insert: {
          category: string
          correct_answer: number
          created_at?: string
          difficulty?: number
          explanation?: string | null
          id?: string
          module?: number
          options: Json
          question_text: string
          topic: string
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string
          difficulty?: number
          explanation?: string | null
          id?: string
          module?: number
          options?: Json
          question_text?: string
          topic?: string
        }
        Relationships: []
      }
      topic_progress: {
        Row: {
          category: string
          completed_questions: number
          correct_answers: number
          created_at: string
          current_difficulty: string
          id: string
          is_unlocked: boolean
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_questions?: number
          correct_answers?: number
          created_at?: string
          current_difficulty?: string
          id?: string
          is_unlocked?: boolean
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_questions?: number
          correct_answers?: number
          created_at?: string
          current_difficulty?: string
          id?: string
          is_unlocked?: boolean
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          mode: string
          question_id: string
          selected_answer: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          mode: string
          question_id: string
          selected_answer: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          mode?: string
          question_id?: string
          selected_answer?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_errors: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number
          daily_check_in_streak: number
          difficulty_anchor: number
          full_exam_tickets: number
          gems: number
          hearts: number
          hearts_updated_at: string
          id: string
          last_activity_date: string | null
          last_check_in_date: string | null
          last_error_queue_clear_date: string | null
          level: number
          mock_exam_tickets: number
          section_exam_tickets: number
          streak: number
          streak_freeze_count: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          daily_check_in_streak?: number
          difficulty_anchor?: number
          full_exam_tickets?: number
          gems?: number
          hearts?: number
          hearts_updated_at?: string
          id?: string
          last_activity_date?: string | null
          last_check_in_date?: string | null
          last_error_queue_clear_date?: string | null
          level?: number
          mock_exam_tickets?: number
          section_exam_tickets?: number
          streak?: number
          streak_freeze_count?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          daily_check_in_streak?: number
          difficulty_anchor?: number
          full_exam_tickets?: number
          gems?: number
          hearts?: number
          hearts_updated_at?: string
          id?: string
          last_activity_date?: string | null
          last_check_in_date?: string | null
          last_error_queue_clear_date?: string | null
          level?: number
          mock_exam_tickets?: number
          section_exam_tickets?: number
          streak?: number
          streak_freeze_count?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_vocabulary: {
        Row: {
          created_at: string
          id: string
          last_reviewed_at: string
          status: string
          updated_at: string
          user_id: string
          word_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reviewed_at?: string
          status?: string
          updated_at?: string
          user_id: string
          word_key: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reviewed_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          word_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_level: {
        Args: {
          _level_id: number
          _mode?: string
          _score_correct?: number
          _score_total?: number
          _unit_id: number
        }
        Returns: Json
      }
      consume_ai_tutor_request: { Args: { _limit?: number }; Returns: Json }
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          display_name: string
          level: number
          streak: number
          user_id: string
          xp: number
        }[]
      }
      mp_clear_jump_cooldown: { Args: { _module: number }; Returns: Json }
      mp_complete_module: { Args: { _module: number }; Returns: Json }
      mp_fail_jump_test: { Args: { _module: number }; Returns: undefined }
      mp_pass_jump_test: {
        Args: { _module: number; _score_correct: number; _score_total: number }
        Returns: Json
      }
      tp_record_progress: {
        Args: {
          _category: string
          _correct: number
          _difficulty?: string
          _topic: string
          _total: number
        }
        Returns: undefined
      }
      ua_record_answer: {
        Args: { _mode?: string; _question_id: string; _selected_answer: number }
        Returns: Json
      }
      up_bump_streak_on_activity: { Args: never; Returns: Json }
      up_clear_error_queue_bonus: { Args: never; Returns: Json }
      up_consume_ticket: { Args: { _ticket: string }; Returns: Json }
      up_daily_check_in: { Args: never; Returns: Json }
      up_lose_heart: { Args: never; Returns: Json }
      up_purchase_item: {
        Args: { _item: string; _quantity?: number }
        Returns: Json
      }
      up_refill_hearts_with_gems: { Args: never; Returns: Json }
      up_restore_heart: { Args: never; Returns: Json }
      up_set_difficulty: {
        Args: { _anchor: number; _correct_streak?: number }
        Returns: undefined
      }
      up_spend_gems: { Args: { _amount: number }; Returns: Json }
      up_use_streak_freeze: { Args: never; Returns: Json }
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

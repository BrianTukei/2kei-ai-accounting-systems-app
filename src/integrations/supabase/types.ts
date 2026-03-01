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
      // ── SaaS tables ──────────────────────────────────────────────
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          industry: string | null
          country: string | null
          timezone: string
          currency: string
          tax_id: string | null
          address: string | null
          phone: string | null
          website: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          industry?: string | null
          country?: string | null
          timezone?: string
          currency?: string
          tax_id?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          industry?: string | null
          country?: string | null
          timezone?: string
          currency?: string
          tax_id?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: Database["public"]["Enums"]["org_role"]
          invited_by: string | null
          invite_email: string | null
          invite_accepted: boolean
          invite_token: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: Database["public"]["Enums"]["org_role"]
          invited_by?: string | null
          invite_email?: string | null
          invite_accepted?: boolean
          invite_token?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          invited_by?: string | null
          invite_email?: string | null
          invite_accepted?: boolean
          invite_token?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_annual: number
          currency: string
          features: Json
          max_users: number
          max_invoices_per_month: number
          max_ai_chats_per_month: number
          max_bank_imports_per_month: number
          max_businesses: number
          has_ai_assistant: boolean
          has_advanced_reports: boolean
          has_payroll: boolean
          has_team_access: boolean
          trial_days: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          price_monthly?: number
          price_annual?: number
          currency?: string
          features?: Json
          max_users?: number
          max_invoices_per_month?: number
          max_ai_chats_per_month?: number
          max_bank_imports_per_month?: number
          max_businesses?: number
          has_ai_assistant?: boolean
          has_advanced_reports?: boolean
          has_payroll?: boolean
          has_team_access?: boolean
          trial_days?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_monthly?: number
          price_annual?: number
          currency?: string
          features?: Json
          max_users?: number
          max_invoices_per_month?: number
          max_ai_chats_per_month?: number
          max_bank_imports_per_month?: number
          max_businesses?: number
          has_ai_assistant?: boolean
          has_advanced_reports?: boolean
          has_payroll?: boolean
          has_team_access?: boolean
          trial_days?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["sub_status"]
          billing_cycle: string
          trial_ends_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          flutterwave_customer_id: string | null
          paystack_customer_id: string | null
          payment_provider: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["sub_status"]
          billing_cycle?: string
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          flutterwave_customer_id?: string | null
          paystack_customer_id?: string | null
          payment_provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["sub_status"]
          billing_cycle?: string
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          flutterwave_customer_id?: string | null
          paystack_customer_id?: string | null
          payment_provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          id: string
          organization_id: string
          type: string
          amount: number | null
          currency: string | null
          provider: string | null
          provider_event_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          type: string
          amount?: number | null
          currency?: string | null
          provider?: string | null
          provider_event_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: string
          amount?: number | null
          currency?: string | null
          provider?: string | null
          provider_event_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          action: string
          tokens_used: number | null
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          action: string
          tokens_used?: number | null
          month: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          action?: string
          tokens_used?: number | null
          month?: string
          created_at?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          id: string
          organization_id: string
          invited_by: string
          email: string
          role: Database["public"]["Enums"]["org_role"]
          token: string
          accepted: boolean
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          invited_by?: string
          email: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
          accepted?: boolean
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          invited_by?: string
          email?: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
          accepted?: boolean
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          description: string
          amount: number
          type: string
          category: string | null
          date: string
          payment_method: string | null
          reference: string | null
          notes: string | null
          is_recurring: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          description: string
          amount: number
          type: string
          category?: string | null
          date: string
          payment_method?: string | null
          reference?: string | null
          notes?: string | null
          is_recurring?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: string
          category?: string | null
          date?: string
          payment_method?: string | null
          reference?: string | null
          notes?: string | null
          is_recurring?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          invoice_number: string
          client_name: string
          client_email: string | null
          client_address: string | null
          issue_date: string
          due_date: string
          status: string
          items: Json
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount: number
          total: number
          notes: string | null
          currency: string
          paid_at: string | null
          payment_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          invoice_number: string
          client_name: string
          client_email?: string | null
          client_address?: string | null
          issue_date: string
          due_date: string
          status?: string
          items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount?: number
          total?: number
          notes?: string | null
          currency?: string
          paid_at?: string | null
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          invoice_number?: string
          client_name?: string
          client_email?: string | null
          client_address?: string | null
          issue_date?: string
          due_date?: string
          status?: string
          items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount?: number
          total?: number
          notes?: string | null
          currency?: string
          paid_at?: string | null
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // ── AI & profile tables ──────────────────────────────────────
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          context_type: string | null
          context_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title?: string
          context_type?: string | null
          context_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          context_type?: string | null
          context_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          title: string
          description: string
          data: Json | null
          severity: string
          is_read: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          insight_type: string
          title: string
          description: string
          data?: Json | null
          severity?: string
          is_read?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: string
          title?: string
          description?: string
          data?: Json | null
          severity?: string
          is_read?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      // ── Existing tables ───────────────────────────────────────────
      receipts: {
        Row: {
          amount: number
          category: string
          confidence_score: number | null
          created_at: string
          currency: string
          date: string
          description: string | null
          id: string
          image_url: string
          items: Json | null
          payment_method: string | null
          receipt_number: string | null
          subtotal: number | null
          tax_amount: number | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          amount: number
          category: string
          confidence_score?: number | null
          created_at?: string
          currency?: string
          date: string
          description?: string | null
          id?: string
          image_url: string
          items?: Json | null
          payment_method?: string | null
          receipt_number?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          amount?: number
          category?: string
          confidence_score?: number | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          id?: string
          image_url?: string
          items?: Json | null
          payment_method?: string | null
          receipt_number?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      get_user_org_id: {
        Args: { _user_id: string }
        Returns: string
      }
      user_org_role: {
        Args: { _user_id: string; _org_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      ai_usage_this_month: {
        Args: { _org_id: string; _action?: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      org_role: "owner" | "accountant" | "manager" | "viewer"
      sub_status: "trialing" | "active" | "past_due" | "canceled" | "paused"
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
      app_role: ["admin", "moderator", "user"],
      org_role: ["owner", "accountant", "manager", "viewer"],
      sub_status: ["trialing", "active", "past_due", "canceled", "paused"],
    },
  },
} as const

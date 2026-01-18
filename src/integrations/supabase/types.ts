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
      business_hours: {
        Row: {
          closing_time: string | null
          created_at: string | null
          day_of_week: number
          establishment_id: string
          id: string
          is_open: boolean
          opening_time: string | null
        }
        Insert: {
          closing_time?: string | null
          created_at?: string | null
          day_of_week: number
          establishment_id: string
          id?: string
          is_open?: boolean
          opening_time?: string | null
        }
        Update: {
          closing_time?: string | null
          created_at?: string | null
          day_of_week?: number
          establishment_id?: string
          id?: string
          is_open?: boolean
          opening_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          delivery_fee: number | null
          delivery_type: string
          establishment_id: string
          id: string
          is_active: boolean | null
          neighborhood: string
        }
        Insert: {
          created_at?: string | null
          delivery_fee?: number | null
          delivery_type: string
          establishment_id: string
          id?: string
          is_active?: boolean | null
          neighborhood: string
        }
        Update: {
          created_at?: string | null
          delivery_fee?: number | null
          delivery_type?: string
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          neighborhood?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_zones_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          establishment_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          establishment_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          establishment_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      establishments: {
        Row: {
          accept_pickup: boolean | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          allow_orders_when_closed: boolean | null
          city: string | null
          cpf_cnpj: string
          created_at: string
          delivery_fee: number | null
          email: string
          free_delivery_min: number | null
          has_pro_plus: boolean | null
          id: string
          logo_url: string | null
          min_order_value: number | null
          name: string
          notify_customer_on_status_change: boolean | null
          pix_key: string | null
          plan_expires_at: string | null
          plan_status: string
          pro_plus_activated_at: string | null
          scheduled_orders_message: string | null
          show_address_on_menu: boolean | null
          slug: string | null
          trial_days: number | null
          trial_end_date: string
          trial_start_date: string
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          accept_pickup?: boolean | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          allow_orders_when_closed?: boolean | null
          city?: string | null
          cpf_cnpj: string
          created_at?: string
          delivery_fee?: number | null
          email: string
          free_delivery_min?: number | null
          has_pro_plus?: boolean | null
          id?: string
          logo_url?: string | null
          min_order_value?: number | null
          name: string
          notify_customer_on_status_change?: boolean | null
          pix_key?: string | null
          plan_expires_at?: string | null
          plan_status?: string
          pro_plus_activated_at?: string | null
          scheduled_orders_message?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_days?: number | null
          trial_end_date?: string
          trial_start_date?: string
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          accept_pickup?: boolean | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          allow_orders_when_closed?: boolean | null
          city?: string | null
          cpf_cnpj?: string
          created_at?: string
          delivery_fee?: number | null
          email?: string
          free_delivery_min?: number | null
          has_pro_plus?: boolean | null
          id?: string
          logo_url?: string | null
          min_order_value?: number | null
          name?: string
          notify_customer_on_status_change?: boolean | null
          pix_key?: string | null
          plan_expires_at?: string | null
          plan_status?: string
          pro_plus_activated_at?: string | null
          scheduled_orders_message?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_days?: number | null
          trial_end_date?: string
          trial_start_date?: string
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          customer_address: string
          customer_name: string | null
          customer_phone: string | null
          delivery_fee: number | null
          delivery_type: string | null
          discount_code: string | null
          discount_value: number | null
          establishment_id: string
          id: string
          items: Json
          neighborhood: string | null
          observations: string | null
          payment_details: string | null
          payment_method: string
          reference_point: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_address: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number | null
          delivery_type?: string | null
          discount_code?: string | null
          discount_value?: number | null
          establishment_id: string
          id?: string
          items: Json
          neighborhood?: string | null
          observations?: string | null
          payment_details?: string | null
          payment_method: string
          reference_point?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          subtotal: number
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_address?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number | null
          delivery_type?: string | null
          discount_code?: string | null
          discount_value?: number | null
          establishment_id?: string
          id?: string
          items?: Json
          neighborhood?: string | null
          observations?: string | null
          payment_details?: string | null
          payment_method?: string
          reference_point?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_additions: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_additions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          max_selections: number | null
          min_selections: number | null
          name: string
          product_id: string
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name: string
          product_id: string
          sort_order?: number | null
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name?: string
          product_id?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          is_default: boolean | null
          name: string
          option_group_id: string
          price: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_default?: boolean | null
          name: string
          option_group_id: string
          price?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_default?: boolean | null
          name?: string
          option_group_id?: string
          price?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_options_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_observations: boolean | null
          available: boolean
          category_id: string
          created_at: string
          description: string | null
          enable_multi_flavor: boolean | null
          establishment_id: string
          flavor_price_rule: string | null
          id: string
          image_url: string | null
          is_promotional: boolean | null
          max_flavors: number | null
          max_quantity: number | null
          name: string
          original_price: number | null
          price: number
          promotional_price: number | null
          subject_to_availability: boolean | null
          unit_type: string | null
        }
        Insert: {
          allow_observations?: boolean | null
          available?: boolean
          category_id: string
          created_at?: string
          description?: string | null
          enable_multi_flavor?: boolean | null
          establishment_id: string
          flavor_price_rule?: string | null
          id?: string
          image_url?: string | null
          is_promotional?: boolean | null
          max_flavors?: number | null
          max_quantity?: number | null
          name: string
          original_price?: number | null
          price?: number
          promotional_price?: number | null
          subject_to_availability?: boolean | null
          unit_type?: string | null
        }
        Update: {
          allow_observations?: boolean | null
          available?: boolean
          category_id?: string
          created_at?: string
          description?: string | null
          enable_multi_flavor?: boolean | null
          establishment_id?: string
          flavor_price_rule?: string | null
          id?: string
          image_url?: string | null
          is_promotional?: boolean | null
          max_flavors?: number | null
          max_quantity?: number | null
          name?: string
          original_price?: number | null
          price?: number
          promotional_price?: number | null
          subject_to_availability?: boolean | null
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address: string
          created_at: string | null
          establishment_id: string
          id: string
          is_default: boolean | null
          neighborhood: string | null
          reference_point: string | null
          whatsapp: string
        }
        Insert: {
          address: string
          created_at?: string | null
          establishment_id: string
          id?: string
          is_default?: boolean | null
          neighborhood?: string | null
          reference_point?: string | null
          whatsapp: string
        }
        Update: {
          address?: string
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_default?: boolean | null
          neighborhood?: string | null
          reference_point?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_addresses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_addresses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_establishments: {
        Row: {
          accept_pickup: boolean | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          city: string | null
          delivery_fee: number | null
          free_delivery_min: number | null
          id: string | null
          logo_url: string | null
          min_order_value: number | null
          name: string | null
          plan_expires_at: string | null
          plan_status: string | null
          show_address_on_menu: boolean | null
          slug: string | null
          trial_end_date: string | null
        }
        Insert: {
          accept_pickup?: boolean | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          city?: string | null
          delivery_fee?: number | null
          free_delivery_min?: number | null
          id?: string | null
          logo_url?: string | null
          min_order_value?: number | null
          name?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_end_date?: string | null
        }
        Update: {
          accept_pickup?: boolean | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          city?: string | null
          delivery_fee?: number | null
          free_delivery_min?: number | null
          id?: string | null
          logo_url?: string | null
          min_order_value?: number | null
          name?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_end_date?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_verifications: { Args: never; Returns: undefined }
      get_establishment_contact: {
        Args: { establishment_id: string }
        Returns: {
          pix_key: string
          whatsapp: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const

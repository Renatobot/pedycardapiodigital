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
      automatic_promotions: {
        Row: {
          conditions: Json | null
          created_at: string | null
          days_of_week: number[] | null
          discount_type: string
          discount_value: number
          end_time: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          min_order_value: number | null
          name: string
          start_time: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          days_of_week?: number[] | null
          discount_type: string
          discount_value: number
          end_time?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          name: string
          start_time?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          days_of_week?: number[] | null
          discount_type?: string
          discount_value?: number
          end_time?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          name?: string
          start_time?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automatic_promotions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatic_promotions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatic_promotions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "business_hours_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
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
          {
            foreignKeyName: "categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          complement: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_default: boolean | null
          label: string | null
          neighborhood: string | null
          number: string
          reference_point: string | null
          street: string
        }
        Insert: {
          complement?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          neighborhood?: string | null
          number: string
          reference_point?: string | null
          street: string
        }
        Update: {
          complement?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          neighborhood?: string | null
          number?: string
          reference_point?: string | null
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string | null
          customer_id: string | null
          establishment_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          establishment_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          establishment_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday: string | null
          complement: string | null
          created_at: string | null
          id: string
          last_order_at: string | null
          name: string
          neighborhood: string | null
          number: string | null
          order_count: number | null
          reference_point: string | null
          street: string | null
          total_spent: number | null
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          birthday?: string | null
          complement?: string | null
          created_at?: string | null
          id?: string
          last_order_at?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          order_count?: number | null
          reference_point?: string | null
          street?: string | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          birthday?: string | null
          complement?: string | null
          created_at?: string | null
          id?: string
          last_order_at?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          order_count?: number | null
          reference_point?: string | null
          street?: string | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "delivery_zones_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
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
          {
            foreignKeyName: "discount_codes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
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
          accept_cash: boolean | null
          accept_credit: boolean | null
          accept_debit: boolean | null
          accept_pickup: boolean | null
          accept_pix: boolean | null
          activated_by_reseller: boolean | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          allow_orders_when_closed: boolean | null
          allow_scheduling_when_open: boolean | null
          cash_change_available: boolean | null
          city: string | null
          cpf_cnpj: string
          created_at: string
          delivery_fee: number | null
          email: string
          free_delivery_min: number | null
          has_completed_onboarding: boolean | null
          has_pro_plus: boolean | null
          id: string
          logo_url: string | null
          menu_theme: string | null
          min_order_value: number | null
          name: string
          notify_customer_on_status_change: boolean | null
          pix_key: string | null
          plan_expires_at: string | null
          plan_status: string
          plan_type: string | null
          primary_color: string | null
          pro_plus_activated_at: string | null
          referral_code: string | null
          reseller_id: string | null
          scheduled_orders_message: string | null
          secondary_color: string | null
          show_address_on_menu: boolean | null
          slug: string | null
          trial_days: number | null
          trial_end_date: string
          trial_start_date: string
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          accept_cash?: boolean | null
          accept_credit?: boolean | null
          accept_debit?: boolean | null
          accept_pickup?: boolean | null
          accept_pix?: boolean | null
          activated_by_reseller?: boolean | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          allow_orders_when_closed?: boolean | null
          allow_scheduling_when_open?: boolean | null
          cash_change_available?: boolean | null
          city?: string | null
          cpf_cnpj: string
          created_at?: string
          delivery_fee?: number | null
          email: string
          free_delivery_min?: number | null
          has_completed_onboarding?: boolean | null
          has_pro_plus?: boolean | null
          id?: string
          logo_url?: string | null
          menu_theme?: string | null
          min_order_value?: number | null
          name: string
          notify_customer_on_status_change?: boolean | null
          pix_key?: string | null
          plan_expires_at?: string | null
          plan_status?: string
          plan_type?: string | null
          primary_color?: string | null
          pro_plus_activated_at?: string | null
          referral_code?: string | null
          reseller_id?: string | null
          scheduled_orders_message?: string | null
          secondary_color?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_days?: number | null
          trial_end_date?: string
          trial_start_date?: string
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          accept_cash?: boolean | null
          accept_credit?: boolean | null
          accept_debit?: boolean | null
          accept_pickup?: boolean | null
          accept_pix?: boolean | null
          activated_by_reseller?: boolean | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          allow_orders_when_closed?: boolean | null
          allow_scheduling_when_open?: boolean | null
          cash_change_available?: boolean | null
          city?: string | null
          cpf_cnpj?: string
          created_at?: string
          delivery_fee?: number | null
          email?: string
          free_delivery_min?: number | null
          has_completed_onboarding?: boolean | null
          has_pro_plus?: boolean | null
          id?: string
          logo_url?: string | null
          menu_theme?: string | null
          min_order_value?: number | null
          name?: string
          notify_customer_on_status_change?: boolean | null
          pix_key?: string | null
          plan_expires_at?: string | null
          plan_status?: string
          plan_type?: string | null
          primary_color?: string | null
          pro_plus_activated_at?: string | null
          referral_code?: string | null
          reseller_id?: string | null
          scheduled_orders_message?: string | null
          secondary_color?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_days?: number | null
          trial_end_date?: string
          trial_start_date?: string
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishments_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_address: string
          customer_id: string | null
          customer_name: string | null
          customer_order_count: number | null
          customer_phone: string | null
          delivery_fee: number | null
          delivery_type: string | null
          discount_code: string | null
          discount_value: number | null
          establishment_id: string
          id: string
          is_registered_customer: boolean | null
          items: Json
          neighborhood: string | null
          observations: string | null
          payment_details: string | null
          payment_method: string
          reference_point: string | null
          rejection_reason: string | null
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
          customer_id?: string | null
          customer_name?: string | null
          customer_order_count?: number | null
          customer_phone?: string | null
          delivery_fee?: number | null
          delivery_type?: string | null
          discount_code?: string | null
          discount_value?: number | null
          establishment_id: string
          id?: string
          is_registered_customer?: boolean | null
          items: Json
          neighborhood?: string | null
          observations?: string | null
          payment_details?: string | null
          payment_method: string
          reference_point?: string | null
          rejection_reason?: string | null
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
          customer_id?: string | null
          customer_name?: string | null
          customer_order_count?: number | null
          customer_phone?: string | null
          delivery_fee?: number | null
          delivery_type?: string | null
          discount_code?: string | null
          discount_value?: number | null
          establishment_id?: string
          id?: string
          is_registered_customer?: boolean | null
          items?: Json
          neighborhood?: string | null
          observations?: string | null
          payment_details?: string | null
          payment_method?: string
          reference_point?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
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
          price_rule: string | null
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
          price_rule?: string | null
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
          price_rule?: string | null
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
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          customer_phone: string
          endpoint: string
          establishment_id: string
          id: string
          p256dh: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          customer_phone: string
          endpoint: string
          establishment_id: string
          id?: string
          p256dh: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          customer_phone?: string
          endpoint?: string
          establishment_id?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_activations: {
        Row: {
          activated_at: string | null
          commission_paid_at: string | null
          commission_percentage: number
          commission_status: string | null
          commission_value: number
          created_at: string | null
          days_activated: number
          establishment_id: string
          establishment_name: string | null
          id: string
          plan_price: number
          plan_type: string
          reseller_id: string
        }
        Insert: {
          activated_at?: string | null
          commission_paid_at?: string | null
          commission_percentage?: number
          commission_status?: string | null
          commission_value?: number
          created_at?: string | null
          days_activated: number
          establishment_id: string
          establishment_name?: string | null
          id?: string
          plan_price: number
          plan_type: string
          reseller_id: string
        }
        Update: {
          activated_at?: string | null
          commission_paid_at?: string | null
          commission_percentage?: number
          commission_status?: string | null
          commission_value?: number
          created_at?: string | null
          days_activated?: number
          establishment_id?: string
          establishment_name?: string | null
          id?: string
          plan_price?: number
          plan_type?: string
          reseller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_activations_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          access_type: string
          active_establishments: number | null
          commission_percentage: number
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_master: boolean | null
          last_activity_at: string | null
          last_login_at: string | null
          name: string
          price_basic: number
          price_pro: number
          price_pro_plus: number
          pricing_mode: string
          referral_code: string
          total_activations: number | null
          total_establishments: number | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          access_type?: string
          active_establishments?: number | null
          commission_percentage?: number
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          last_activity_at?: string | null
          last_login_at?: string | null
          name: string
          price_basic?: number
          price_pro?: number
          price_pro_plus?: number
          pricing_mode?: string
          referral_code: string
          total_activations?: number | null
          total_establishments?: number | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          access_type?: string
          active_establishments?: number | null
          commission_percentage?: number
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          last_activity_at?: string | null
          last_login_at?: string | null
          name?: string
          price_basic?: number
          price_pro?: number
          price_pro_plus?: number
          pricing_mode?: string
          referral_code?: string
          total_activations?: number | null
          total_establishments?: number | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          complement: string | null
          created_at: string | null
          establishment_id: string
          id: string
          is_default: boolean | null
          neighborhood: string | null
          number: string | null
          reference_point: string | null
          street: string | null
          whatsapp: string
        }
        Insert: {
          address: string
          complement?: string | null
          created_at?: string | null
          establishment_id: string
          id?: string
          is_default?: boolean | null
          neighborhood?: string | null
          number?: string | null
          reference_point?: string | null
          street?: string | null
          whatsapp: string
        }
        Update: {
          address?: string
          complement?: string | null
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_default?: boolean | null
          neighborhood?: string | null
          number?: string | null
          reference_point?: string | null
          street?: string | null
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
          {
            foreignKeyName: "saved_addresses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      store_push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          establishment_id: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          establishment_id: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          establishment_id?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_push_subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_push_subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_push_subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
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
      whatsapp_templates: {
        Row: {
          created_at: string | null
          establishment_id: string
          id: string
          message: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          id?: string
          message: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          id?: string
          message?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "public_establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_metrics: {
        Row: {
          avg_ticket: number | null
          completed_orders: number | null
          delivery_count: number | null
          establishment_id: string | null
          order_date: string | null
          pickup_count: number | null
          revenue: number | null
          total_orders: number | null
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
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "reseller_establishments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      public_establishments: {
        Row: {
          accept_pickup: boolean | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          allow_orders_when_closed: boolean | null
          city: string | null
          delivery_fee: number | null
          free_delivery_min: number | null
          id: string | null
          logo_url: string | null
          menu_theme: string | null
          min_order_value: number | null
          name: string | null
          plan_expires_at: string | null
          plan_status: string | null
          primary_color: string | null
          scheduled_orders_message: string | null
          secondary_color: string | null
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
          allow_orders_when_closed?: boolean | null
          city?: string | null
          delivery_fee?: number | null
          free_delivery_min?: number | null
          id?: string | null
          logo_url?: string | null
          menu_theme?: string | null
          min_order_value?: number | null
          name?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          primary_color?: string | null
          scheduled_orders_message?: string | null
          secondary_color?: string | null
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
          allow_orders_when_closed?: boolean | null
          city?: string | null
          delivery_fee?: number | null
          free_delivery_min?: number | null
          id?: string | null
          logo_url?: string | null
          menu_theme?: string | null
          min_order_value?: number | null
          name?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          primary_color?: string | null
          scheduled_orders_message?: string | null
          secondary_color?: string | null
          show_address_on_menu?: boolean | null
          slug?: string | null
          trial_end_date?: string | null
        }
        Relationships: []
      }
      reseller_establishments_view: {
        Row: {
          activated_by_reseller: boolean | null
          created_at: string | null
          id: string | null
          name: string | null
          plan_expires_at: string | null
          plan_status: string | null
          plan_type: string | null
          reseller_id: string | null
          trial_end_date: string | null
          whatsapp: string | null
        }
        Insert: {
          activated_by_reseller?: boolean | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          plan_type?: string | null
          reseller_id?: string | null
          trial_end_date?: string | null
          whatsapp?: string | null
        }
        Update: {
          activated_by_reseller?: boolean | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          plan_expires_at?: string | null
          plan_status?: string | null
          plan_type?: string | null
          reseller_id?: string | null
          trial_end_date?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
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
      get_reseller_by_code: {
        Args: { code: string }
        Returns: {
          id: string
          name: string
          price_basic: number
          price_pro: number
          price_pro_plus: number
          pricing_mode: string
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
      app_role: "admin" | "moderator" | "user" | "reseller"
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
      app_role: ["admin", "moderator", "user", "reseller"],
    },
  },
} as const

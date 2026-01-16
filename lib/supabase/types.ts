/**
 * Database Type Definitions
 * Generated types for Supabase schema
 * Phase 2: Database Schema & Core Data Management
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      zones: {
        Row: {
          id: number
          name: string
          code: string
          description: string | null
          states: string[]
          color: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          code: string
          description?: string | null
          states: string[]
          color: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          code?: string
          description?: string | null
          states?: string[]
          color?: string
          created_at?: string
        }
      }
      warehouses: {
        Row: {
          id: number
          code: string
          name: string
          city: string
          state: string
          zip: string
          lat: number | null
          lng: number | null
          is_active: boolean
          serves_zones: number[]
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          city: string
          state: string
          zip: string
          lat?: number | null
          lng?: number | null
          is_active?: boolean
          serves_zones: number[]
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          city?: string
          state?: string
          zip?: string
          lat?: number | null
          lng?: number | null
          is_active?: boolean
          serves_zones?: number[]
          created_at?: string
        }
      }
      upload_batches: {
        Row: {
          id: string
          filename: string
          uploaded_at: string
          row_count: number
          status: 'processing' | 'completed' | 'error'
          error_message: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          uploaded_at?: string
          row_count: number
          status: 'processing' | 'completed' | 'error'
          error_message?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          uploaded_at?: string
          row_count?: number
          status?: 'processing' | 'completed' | 'error'
          error_message?: string | null
          user_id?: string
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          company_name: string
          address: string
          city: string
          state: string
          zip: string
          lat: number | null
          lng: number | null
          zone_id: number | null
          customer_type: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          address: string
          city: string
          state: string
          zip: string
          lat?: number | null
          lng?: number | null
          zone_id?: number | null
          customer_type?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          lat?: number | null
          lng?: number | null
          zone_id?: number | null
          customer_type?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          item_code: string
          description: string
          pack_size: string
          case_weight_lbs: number | null
          brand: string | null
          category: string | null
          warehouse_id: number | null
          cases_available: number
          unit_cost: number | null
          cost_per_lb: number | null
          spec_sheet_url: string | null
          upload_batch_id: string | null
          default_margin_percent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          item_code: string
          description: string
          pack_size: string
          case_weight_lbs?: number | null
          brand?: string | null
          category?: string | null
          warehouse_id?: number | null
          cases_available?: number
          unit_cost?: number | null
          cost_per_lb?: number | null
          spec_sheet_url?: string | null
          upload_batch_id?: string | null
          default_margin_percent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          item_code?: string
          description?: string
          pack_size?: string
          case_weight_lbs?: number | null
          brand?: string | null
          category?: string | null
          warehouse_id?: number | null
          cases_available?: number
          unit_cost?: number | null
          cost_per_lb?: number | null
          spec_sheet_url?: string | null
          upload_batch_id?: string | null
          default_margin_percent?: number | null
          created_at?: string
        }
      }
      price_sheets: {
        Row: {
          id: string
          zone_id: number | null
          week_start: string
          week_end: string
          status: 'draft' | 'published' | 'archived'
          excel_storage_path: string | null
          pdf_storage_path: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          zone_id?: number | null
          week_start: string
          week_end: string
          status: 'draft' | 'published' | 'archived'
          excel_storage_path?: string | null
          pdf_storage_path?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          zone_id?: number | null
          week_start?: string
          week_end?: string
          status?: 'draft' | 'published' | 'archived'
          excel_storage_path?: string | null
          pdf_storage_path?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      price_sheet_items: {
        Row: {
          id: string
          price_sheet_id: string | null
          product_id: string | null
          warehouse_id: number | null
          cost_per_lb: number
          margin_percent: number
          margin_amount: number
          freight_per_lb: number
          delivered_price_lb: number
          created_at: string
        }
        Insert: {
          id?: string
          price_sheet_id?: string | null
          product_id?: string | null
          warehouse_id?: number | null
          cost_per_lb: number
          margin_percent: number
          margin_amount: number
          freight_per_lb: number
          delivered_price_lb: number
          created_at?: string
        }
        Update: {
          id?: string
          price_sheet_id?: string | null
          product_id?: string | null
          warehouse_id?: number | null
          cost_per_lb?: number
          margin_percent?: number
          margin_amount?: number
          freight_per_lb?: number
          delivered_price_lb?: number
          created_at?: string
        }
      }
      freight_rates: {
        Row: {
          id: string
          origin_warehouse_id: number | null
          destination_zone_id: number | null
          city: string | null
          state: string | null
          rate_per_lb: number
          rate_type: 'dry_ltl' | 'frozen_ltl' | 'truckload'
          weight_lbs: number
          dry_ltl_quote: number | null
          multipliers: Json | null
          valid_from: string
          valid_until: string | null
          goship_quote_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          origin_warehouse_id?: number | null
          destination_zone_id?: number | null
          city?: string | null
          state?: string | null
          rate_per_lb: number
          rate_type: 'dry_ltl' | 'frozen_ltl' | 'truckload'
          weight_lbs: number
          dry_ltl_quote?: number | null
          multipliers?: Json | null
          valid_from?: string
          valid_until?: string | null
          goship_quote_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          origin_warehouse_id?: number | null
          destination_zone_id?: number | null
          city?: string | null
          state?: string | null
          rate_per_lb?: number
          rate_type?: 'dry_ltl' | 'frozen_ltl' | 'truckload'
          weight_lbs?: number
          dry_ltl_quote?: number | null
          multipliers?: Json | null
          valid_from?: string
          valid_until?: string | null
          goship_quote_id?: string | null
          created_at?: string
        }
      }
      manufacturer_deals: {
        Row: {
          id: string
          source_type: 'email' | 'pdf' | 'manual'
          source_content: string | null
          parsed_data: Json | null
          product_description: string | null
          price_per_lb: number | null
          quantity_lbs: number | null
          expiration_date: string | null
          manufacturer: string | null
          confidence_score: number | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          source_type: 'email' | 'pdf' | 'manual'
          source_content?: string | null
          parsed_data?: Json | null
          product_description?: string | null
          price_per_lb?: number | null
          quantity_lbs?: number | null
          expiration_date?: string | null
          manufacturer?: string | null
          confidence_score?: number | null
          status: 'pending' | 'approved' | 'rejected'
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          source_type?: 'email' | 'pdf' | 'manual'
          source_content?: string | null
          parsed_data?: Json | null
          product_description?: string | null
          price_per_lb?: number | null
          quantity_lbs?: number | null
          expiration_date?: string | null
          manufacturer?: string | null
          confidence_score?: number | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          user_id?: string
        }
      }
      ai_processing_log: {
        Row: {
          id: string
          task_type: string
          input_summary: string | null
          output_summary: string | null
          tokens_used: number | null
          model: string | null
          latency_ms: number | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_type: string
          input_summary?: string | null
          output_summary?: string | null
          tokens_used?: number | null
          model?: string | null
          latency_ms?: number | null
          success: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_type?: string
          input_summary?: string | null
          output_summary?: string | null
          tokens_used?: number | null
          model?: string | null
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
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
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Row<T extends keyof Database['public']['Tables']> = Tables<T>['Row']
export type Insert<T extends keyof Database['public']['Tables']> = Tables<T>['Insert']
export type Update<T extends keyof Database['public']['Tables']> = Tables<T>['Update']

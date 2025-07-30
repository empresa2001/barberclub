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
      user_types: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      barbershop_status: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      appointment_status: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          password: string
          name: string
          user_type_id: number
          barber_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          user_type_id: number
          barber_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          name?: string
          user_type_id?: number
          barber_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: true
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
      barbershops: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          status_id: number
          description: string
          location: string
          phone: string
          image_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          status_id?: number
          description?: string
          location: string
          phone?: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          status_id?: number
          description?: string
          location?: string
          phone?: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbershops_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "barbershop_status"
            referencedColumns: ["id"]
          }
        ]
      }
      barbers: {
        Row: {
          id: string
          user_id: string
          barbershop_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          barbershop_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          barbershop_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          day_of_week: number
          from_time: string
          to_time: string
          barber_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_of_week: number
          from_time: string
          to_time: string
          barber_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_of_week?: number
          from_time?: string
          to_time?: string
          barber_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          duration_min: number
          barbershop_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          price: number
          duration_min: number
          barbershop_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          duration_min?: number
          barbershop_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          date: string
          duration_min: number
          status_id: number
          customer_name: string
          customer_email: string
          barber_id: string
          service_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          duration_min: number
          status_id?: number
          customer_name: string
          customer_email: string
          barber_id: string
          service_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          duration_min?: number
          status_id?: number
          customer_name?: string
          customer_email?: string
          barber_id?: string
          service_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "appointment_status"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      barber_details: {
        Row: {
          barber_id: string | null
          name: string | null
          email: string | null
          barbershop_id: string | null
          barbershop_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
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

// Convenient type aliases for easier usage
export type UserType = Database['public']['Tables']['user_types']['Row']
export type BarbershopStatus = Database['public']['Tables']['barbershop_status']['Row']
export type AppointmentStatus = Database['public']['Tables']['appointment_status']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Barbershop = Database['public']['Tables']['barbershops']['Row']
export type Barber = Database['public']['Tables']['barbers']['Row']
export type Schedule = Database['public']['Tables']['schedules']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type BarbershopInsert = Database['public']['Tables']['barbershops']['Insert']
export type BarberInsert = Database['public']['Tables']['barbers']['Insert']
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type BarbershopUpdate = Database['public']['Tables']['barbershops']['Update']
export type BarberUpdate = Database['public']['Tables']['barbers']['Update']
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

// View types
export type BarberDetails = Database['public']['Views']['barber_details']['Row']
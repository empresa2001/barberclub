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
      schedule_exceptions: {
        Row: {
          id: string;
          barber_id: string;
          date: string; // YYYY-MM-DD
          from_time: string | null; // puede ser null si es bloqueo total
          to_time: string | null;   // puede ser null si es bloqueo total
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barber_id: string;
          date: string;
          from_time?: string | null;
          to_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barber_id?: string;
          date?: string;
          from_time?: string | null;
          to_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_barber_id_fkey",
            columns: ["barber_id"],
            isOneToOne: false,
            referencedRelation: "barbers",
            referencedColumns: ["id"]
          }
        ];
      },
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
        ],
      }
      barbershops: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          status_id: number
          description: string
          location: string
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
          customer_phone: string | null
          booking_code: string
          cancelled_at: string | null
          cancelled_by: string | null
          updated_by: string | null
          rescheduled_from: string | null
          notes: string | null
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
          customer_phone?: string | null
          booking_code?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          updated_by?: string | null
          rescheduled_from?: string | null
          notes?: string | null
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
          customer_phone?: string | null
          booking_code?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          updated_by?: string | null
          rescheduled_from?: string | null
          notes?: string | null
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
      appointment_audit_log: {
        Row: {
          id: string
          appointment_id: string
          action: string
          actor_type: string
          actor_user_id: string | null
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          action: string
          actor_type?: string
          actor_user_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_audit_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      cash_registers: {
        Row: {
          id: string
          barbershop_id: string
          business_date: string
          opened_by: string | null
          closed_by: string | null
          opening_amount: number
          counted_amount: number | null
          notes: string | null
          opened_at: string
          closed_at: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          business_date?: string
          opened_by?: string | null
          closed_by?: string | null
          opening_amount?: number
          counted_amount?: number | null
          notes?: string | null
          opened_at?: string
          closed_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          business_date?: string
          opened_by?: string | null
          closed_by?: string | null
          opening_amount?: number
          counted_amount?: number | null
          notes?: string | null
          opened_at?: string
          closed_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      cash_movements: {
        Row: {
          id: string
          cash_register_id: string
          appointment_id: string | null
          type: string
          concept: string
          amount: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cash_register_id: string
          appointment_id?: string | null
          type: string
          concept: string
          amount: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cash_register_id?: string
          appointment_id?: string | null
          type?: string
          concept?: string
          amount?: number
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
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
      get_busy_slots: {
        Args: {
          p_barber_id: string
          p_from: string
          p_to: string
        }
        Returns: {
          date: string
          duration_min: number
        }[]
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
export type ScheduleException = Database['public']['Tables']['schedule_exceptions']['Row']
export type AppointmentAuditLog = Database['public']['Tables']['appointment_audit_log']['Row']
export type CashRegister = Database['public']['Tables']['cash_registers']['Row']
export type CashMovement = Database['public']['Tables']['cash_movements']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type BarbershopInsert = Database['public']['Tables']['barbershops']['Insert']
export type BarberInsert = Database['public']['Tables']['barbers']['Insert']
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type ScheduleExceptionInsert = Database['public']['Tables']['schedule_exceptions']['Insert']
export type AppointmentAuditLogInsert = Database['public']['Tables']['appointment_audit_log']['Insert']
export type CashRegisterInsert = Database['public']['Tables']['cash_registers']['Insert']
export type CashMovementInsert = Database['public']['Tables']['cash_movements']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type BarbershopUpdate = Database['public']['Tables']['barbershops']['Update']
export type BarberUpdate = Database['public']['Tables']['barbers']['Update']
export type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
export type ScheduleExceptionUpdate = Database['public']['Tables']['schedule_exceptions']['Update']
export type AppointmentAuditLogUpdate = Database['public']['Tables']['appointment_audit_log']['Update']
export type CashRegisterUpdate = Database['public']['Tables']['cash_registers']['Update']
export type CashMovementUpdate = Database['public']['Tables']['cash_movements']['Update']

// View types
export type BarberDetails = Database['public']['Views']['barber_details']['Row']

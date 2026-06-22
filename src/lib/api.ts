// API Configuration using Supabase
import { supabase } from './supabase'
import { 
  // userService, 
  barbershopService, 
  barberService, 
  serviceService, 
  appointmentService,
  scheduleService,
  lookupService
} from './database'
import type { 
  BarbershopInsert,
  BarberInsert,
  ServiceInsert,
  AppointmentInsert,
  ScheduleInsert
} from './database.types'

// Authentication utilities
export const authHelper = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Set up auth state listener
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Auth API methods
export const authApi = {
  // Sign in with email and password
  signIn: async (credentials: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (error) throw error
    return data
  },
  
  signUp: async (userData: { 
    email: string; 
    password: string; 
    name: string;
    barbershopName: string;
    barbershopAddress: string;
    barbershopPhone: string;
    barbershopEmail?: string;
  }) => {
    const email = userData.email.trim().toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: userData.password,
      options: {
        data: {
          name: userData.name.trim(),
          role: 'owner'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    const response = await fetch('/api/register-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUserId: authData.user.id,
        email,
        name: userData.name,
        barbershopName: userData.barbershopName,
        barbershopAddress: userData.barbershopAddress,
        barbershopPhone: userData.barbershopPhone,
        barbershopEmail: userData.barbershopEmail,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || 'No se pudo completar el registro');
    }

    return {
      user: authData.user,
      ...result,
    };
  },
  
  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  // Get current session
  getSession: () => authHelper.getSession(),
  
  // Get current user
  getCurrentUser: () => authHelper.getCurrentUser(),
  
  // Request password reset
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return data
  },
  
  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return data
  },
};

// Barbershops API
export const barbershopsApi = {
  getAll: () => barbershopService.getAll(),
  getById: (id: string) => barbershopService.getById(id),
  create: (data: BarbershopInsert) => barbershopService.create(data),
  update: (id: string, data: Partial<BarbershopInsert>) => barbershopService.update(id, data),
  delete: (id: string) => barbershopService.delete(id),
  updateStatus: async (id: string, statusName: 'active' | 'pending' | 'inactive') => {
    console.log('🔄 Actualizando estado:', { id, statusName });
    
    // Get status ID from name
    const statuses = await lookupService.getBarbershopStatuses()
    console.log('📋 Estados disponibles:', statuses);
    
    const status = statuses.find(s => s.name === statusName)
    console.log('🎯 Estado encontrado:', status);
    
    if (!status) {
      console.error('❌ Estado no encontrado:', statusName);
      console.error('📋 Estados disponibles:', statuses.map(s => s.name));
      throw new Error(`Invalid status: ${statusName}. Available: ${statuses.map(s => s.name).join(', ')}`)
    }
    
    console.log('💾 Actualizando barbería con status_id:', status.id);
    return barbershopService.update(id, { status_id: status.id })
  },
};

// Barbers API
export const barbersApi = {
  getAll: (barbershopId?: string) => 
    barbershopId ? barberService.getByBarbershop(barbershopId) : [],
  getById: (id: string) => barberService.getByUserId(id), // Assuming we're searching by user ID
  getByUserId: (userId: string) => barberService.getByUserId(userId),
  create: (data: BarberInsert) => barberService.create(data),
  delete: (id: string) => barberService.delete(id),
};

// Services API
export const servicesApi = {
  getAll: (barbershopId?: string) => 
    barbershopId ? serviceService.getByBarbershop(barbershopId) : [],
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  create: (data: ServiceInsert) => serviceService.create(data),
  update: (id: string, data: Partial<ServiceInsert>) => serviceService.update(id, data),
  delete: (id: string) => serviceService.delete(id),
};

// Schedules API
export const schedulesApi = {
  getByBarber: (barberId: string) => scheduleService.getByBarber(barberId),
  create: (data: ScheduleInsert) => scheduleService.create(data),
  update: (id: string, data: Partial<ScheduleInsert>) => scheduleService.update(id, data),
  delete: (id: string) => scheduleService.delete(id),
};

// Appointments API
export const appointmentsApi = {
  getAll: (barbershopId?: string) => 
    barbershopId ? appointmentService.getByBarbershop(barbershopId) : [],
  getByBarber: (barberId: string, limit?: number) => 
    appointmentService.getByBarber(barberId, limit),
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services(name, price),
        appointment_status(name),
        barbers(*, users!barbers_user_id_fkey(name))
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  create: (data: AppointmentInsert) => appointmentService.create(data),
  update: (id: string, data: Partial<AppointmentInsert>) => appointmentService.update(id, data),
  delete: (id: string) => appointmentService.delete(id),
  cancel: (id: string) => appointmentService.cancel(id),
  updateStatus: async (id: string, statusName: string) => {
    // Get status ID from name
    const statuses = await lookupService.getAppointmentStatuses()
    const status = statuses.find(s => s.name === statusName)
    if (!status) throw new Error('Invalid status')
    
    return appointmentService.update(id, { status_id: status.id })
  },
};

// Lookup API
export const lookupsApi = {
  getUserTypes: () => lookupService.getUserTypes(),
  getBarbershopStatuses: () => lookupService.getBarbershopStatuses(),
  getAppointmentStatuses: () => lookupService.getAppointmentStatuses(),
};

// Re-export types from database.types for backward compatibility
export type {
  Barbershop,
  Barber,
  Service,
  Appointment,
  Schedule,
  BarbershopInsert,
  BarberInsert,
  ServiceInsert,
  AppointmentInsert,
  ScheduleInsert,
  UserType,
  BarbershopStatus,
  AppointmentStatus
} from './database.types';

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

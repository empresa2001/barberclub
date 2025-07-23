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
  
  // Sign up with email and password
signUp: async (userData: { 
  email: string; 
  password: string; 
  name: string;
  barbershopName: string;
  barbershopAddress: string;
  barbershopPhone: string;
  barbershopEmail?: string;
}) => {
  try {
    console.log('🚀 Iniciando registro...');

    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: 'owner'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    console.log('✅ Usuario creado en auth', authData.user.id);

    // 2. Verificar que el usuario existe en public.users (con reintentos)
    let userExists = false;
    let retries = 0;
    const maxRetries = 5;

    while (!userExists && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!checkError && existingUser) {
        userExists = true;
        console.log('✅ Usuario encontrado en public.users');
      } else {
        retries++;
        console.log(`⏳ Esperando que se cree el usuario... intento ${retries}/${maxRetries}`);
      }
    }

    // 3. Si el trigger falló, crear manualmente
    if (!userExists) {
      console.log('⚠️ Trigger falló, creando usuario manualmente...');
      const { error: manualUserError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          user_type_id: 2
        });

      if (manualUserError) {
        console.error('Error creando usuario manualmente:', manualUserError);
        throw manualUserError;
      }
      console.log('✅ Usuario creado manualmente');
    }

    // 4. Crear la barbería
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .insert({
        name: userData.barbershopName,
        description: 'Nueva barbería',
        location: userData.barbershopAddress,
        phone: userData.barbershopPhone,
        email: userData.barbershopEmail || null,
        owner_id: authData.user.id,
        status_id: 1
      })
      .select()
      .single();

    if (barbershopError) throw barbershopError;
    console.log('✅ Barbería creada');

    // 5. Crear el barbero (ahora debería funcionar)
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .insert({
        user_id: authData.user.id,
        barbershop_id: barbershop.id
      })
      .select()
      .single();

    if (barberError) {
      console.error('Error detallado del barbero:', barberError);
      throw barberError;
    }
    console.log('✅ Barbero creado');

    // 6. Actualizar el usuario con el barber_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ barber_id: barber.id })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
    } else {
      console.log('✅ Usuario actualizado con barber_id');
    }

    return {
      user: authData.user,
      barbershop,
      barber
    };

  } catch (error) {
    console.error('❌ Error en signUp:', error);
    throw error;
  }
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
    // Get status ID from name
    const statuses = await lookupService.getBarbershopStatuses()
    const status = statuses.find(s => s.name === statusName)
    if (!status) throw new Error('Invalid status')
    
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
        barbers(*, users(name))
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

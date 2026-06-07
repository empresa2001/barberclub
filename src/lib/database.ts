import { supabase } from './supabase'
import type { 
  Barbershop, 
  Barber, 
  Service, 
  Appointment,
  Schedule,
  BarbershopInsert,
  BarberInsert,
  ServiceInsert,
  AppointmentInsert,
  ScheduleInsert
} from './database.types'

// Auth operations
export const authService = {
  // Get user profile by ID
  async getProfile(userId: string) {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)
    if (error) throw error
    return user
  },

  // Get current user profile
  async getCurrentProfile() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Update user profile
  async updateProfile(updates: { name?: string; email?: string; phone?: string }) {
    const { data: { user }, error } = await supabase.auth.updateUser({
      data: updates
    })
    if (error) throw error
    return user
  }
}

// Barbershop operations
export const barbershopService = {
  // Get all barbershops
  async getAll(): Promise<Barbershop[]> {
    // Primero probamos una consulta muy simple
    console.log('🔍 Probando consulta simple a barbershops...');
    
    const { data: simpleData, error: simpleError } = await supabase
      .from('barbershops')
      .select('*')
      .limit(10);
    
    if (simpleError) {
      console.error('❌ Error en consulta simple:', simpleError);
    } else {
      console.log('📊 Registros encontrados (consulta simple):', simpleData?.length || 0);
      console.log('📋 Datos simples:', simpleData);
    }
    
    // Obtener datos sin relación externa y mapear manualmente
    const { data, error } = await supabase
      .from('barbershops')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error en consulta barbershops:', error);
      throw error;
    }
    
    console.log('📋 Datos raw de barbershops:', data);
    
    // Mapear los status_id a nombres manualmente ya que la tabla barbershop_status puede estar vacía
    const mappedData = data?.map(barbershop => ({
      ...barbershop,
      barbershop_status: { 
        name: barbershop.status_id === 1 ? 'pending' : 
              barbershop.status_id === 2 ? 'active' : 
              barbershop.status_id === 3 ? 'inactive' : 'pending'
      }
    })) || []
    
    console.log('📋 Datos mapeados de barbershops:', mappedData);
    return mappedData || []
  },

  // Get barbershop by ID
  async getById(id: string): Promise<Barbershop | null> {
    const { data, error } = await supabase
      .from('barbershops')
      .select(`
        *,
        users(name, email)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    // Mapear el status manualmente si encontramos data
    if (data) {
      return {
        ...data,
        barbershop_status: { 
          name: data.status_id === 1 ? 'pending' : 
                data.status_id === 2 ? 'active' : 
                data.status_id === 3 ? 'inactive' : 'pending'
        }
      } as Barbershop
    }
    
    return data
  },

  // Create barbershop
  async create(barbershopData: BarbershopInsert): Promise<Barbershop> {
    const { data, error } = await supabase
      .from('barbershops')
      .insert(barbershopData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update barbershop
  async update(id: string, updates: Partial<BarbershopInsert>): Promise<Barbershop> {
    const { data, error } = await supabase
      .from('barbershops')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete barbershop
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('barbershops')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Barber operations
export const barberService = {
  // Get barbers by barbershop
  async getByBarbershop(barbershopId: string): Promise<Barber[]> {
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        *,
        barbershops(name)
      `)
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get barber by user ID
  async getByUserId(userId: string): Promise<Barber | null> {
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        *,
        barbershops(name)
      `)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Create barber
  async create(barberData: BarberInsert): Promise<Barber> {
    const { data, error } = await supabase
      .from('barbers')
      .insert(barberData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete barber
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('barbers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Service operations
export const serviceService = {
  // Get services by barbershop
  async getByBarbershop(barbershopId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Create service
  async create(serviceData: ServiceInsert): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update service
  async update(id: string, updates: Partial<ServiceInsert>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete service
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Schedule operations
export const scheduleService = {
  // Get schedules by barber
  async getByBarber(barberId: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('barber_id', barberId)
      .order('day_of_week')
    
    if (error) throw error
    return data || []
  },

  // Create schedule
  async create(scheduleData: ScheduleInsert): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update schedule
  async update(id: string, updates: Partial<ScheduleInsert>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete schedule
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Appointment operations
export const appointmentService = {
  // Get appointments by barbershop
  async getByBarbershop(barbershopId: string, limit?: number): Promise<Appointment[]> {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        barbers(*, users!barbers_user_id_fkey(name)),
        services(name, price),
        appointment_status(name)
      `)
      .eq('barbers.barbershop_id', barbershopId)
      .order('date', { ascending: true })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  // Get appointments by barber
  async getByBarber(barberId: string, limit?: number): Promise<Appointment[]> {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        services(name, price),
        appointment_status(name)
      `)
      .eq('barber_id', barberId)
      .order('date', { ascending: true })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  // Create appointment
  async create(appointmentData: AppointmentInsert): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update appointment
  async update(id: string, updates: Partial<AppointmentInsert>): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Cancel appointment
  async cancel(id: string): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status_id: 3 }) // 3 = cancelled status
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete appointment
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Lookup table operations
export const lookupService = {
  // Get user types
  async getUserTypes() {
    const { data, error } = await supabase
      .from('user_types')
      .select('*')
      .order('id')
    
    if (error) throw error
    return data || []
  },

  // Get barbershop statuses
  async getBarbershopStatuses() {
    console.log('🔍 Obteniendo estados de barbería...');
    const { data, error } = await supabase
      .from('barbershop_status')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('❌ Error obteniendo estados:', error);
      throw error;
    }
    
    console.log('✅ Estados obtenidos:', data);
    
    // Si no hay datos, intentar usar datos por defecto sin crear en la DB
    if (!data || data.length === 0) {
      console.log('⚠️ No hay estados en la DB, usando valores por defecto');
      // Retornar valores por defecto hardcodeados
      return [
        { id: 1, name: 'pending' },
        { id: 2, name: 'active' },
        { id: 3, name: 'inactive' }
      ];
    }
    
    // Verificar que existan los estados necesarios
    const requiredStatuses = ['pending', 'active', 'inactive'];
    const existingStatuses = data.map(s => s.name);
    const missingStatuses = requiredStatuses.filter(status => !existingStatuses.includes(status));
    
    if (missingStatuses.length > 0) {
      console.log('⚠️ Estados faltantes:', missingStatuses, 'usando valores por defecto');
      // En lugar de intentar crear, usar valores por defecto
      const defaultStatuses = [
        { id: 1, name: 'pending' },
        { id: 2, name: 'active' },
        { id: 3, name: 'inactive' }
      ];
      return defaultStatuses;
    }
    
    return data || []
  },

  // Inicializar estados de barbería por defecto
  async initializeBarbershopStatuses() {
    const defaultStatuses = [
      { name: 'pending' },
      { name: 'active' },
      { name: 'inactive' }
    ];

    const { error } = await supabase
      .from('barbershop_status')
      .insert(defaultStatuses);

    if (error) {
      console.error('❌ Error inicializando estados:', error);
      throw error;
    }

    console.log('✅ Estados por defecto creados');
  },

  // Crear estados faltantes
  async createMissingStatuses(missingStatuses: string[]) {
    const statusesToCreate = missingStatuses.map(name => ({ name }));

    const { error } = await supabase
      .from('barbershop_status')
      .insert(statusesToCreate);

    if (error) {
      console.error('❌ Error creando estados faltantes:', error);
      throw error;
    }

    console.log('✅ Estados faltantes creados:', missingStatuses);
  },

  // Get appointment statuses
  async getAppointmentStatuses() {
    const { data, error } = await supabase
      .from('appointment_status')
      .select('*')
      .order('id')
    
    if (error) throw error
    return data || []
  }
}
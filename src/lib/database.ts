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
    const { data, error } = await supabase
      .from('barbershops')
      .select(`
        *,
        barbershop_status(name),
        users(name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get barbershop by ID
  async getById(id: string): Promise<Barbershop | null> {
    const { data, error } = await supabase
      .from('barbershops')
      .select(`
        *,
        barbershop_status(name),
        users(name, email)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
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
        barbers(*, users(name)),
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
    const { data, error } = await supabase
      .from('barbershop_status')
      .select('*')
      .order('id')
    
    if (error) throw error
    return data || []
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
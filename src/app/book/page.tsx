'use client';

import { Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

export default function BookPage() {

  const [selectedBarbershop, setSelectedBarbershop] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Datos reales desde Supabase
  const [barbershops, setBarbershops] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Horarios disponibles desde Supabase (tabla schedules)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<{time: string, available: boolean}[]>([]);

  // Cargar barberías al montar
  useEffect(() => {
    const fetchBarbershops = async () => {
      const { data, error } = await supabase.from('barbershops').select('*').order('name');
      if (!error) setBarbershops(data || []);
    };
    fetchBarbershops();
  }, []);

  // Cargar barberos (con nombre) cuando cambia la barbería
  useEffect(() => {
    if (!selectedBarbershop) {
      setBarbers([]);
      setServices([]);
      setSelectedBarber('');
      setSelectedService('');
      return;
    }
    const fetchBarbers = async () => {
      // Join correcto: traer barberos y el usuario relacionado (nombre y email)
      // Si no existe la relación barbers_user_id_fkey, usar users(user_id)
      const { data, error } = await supabase
        .from('barbers')
        .select('id, user_id, users!barbers_user_id_fkey(name, email)')
        .eq('barbershop_id', selectedBarbershop);
      if (!error && data) setBarbers(data);
    };
    fetchBarbers();
  }, [selectedBarbershop]);

  // Cargar servicios cuando cambia el barbero
  useEffect(() => {
    if (!selectedBarbershop) {
      setServices([]);
      setSelectedService('');
      return;
    }
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', selectedBarbershop)
        .order('name');
      if (!error) setServices(data || []);
    };
    fetchServices();
  }, [selectedBarbershop]);

  useEffect(() => {
    // Solo buscar si hay barbero, fecha y servicio seleccionados
    if (!selectedBarber || !selectedDate || !selectedService) {
      setAvailableTimeSlots([]);
      setAllTimeSlots([]);
      return;
    }

    let isCancelled = false; // Flag para cancelar requests obsoletos

    const fetchAvailableSlots = async () => {
      const dayOfWeek = new Date(selectedDate).getDay();
      console.log('[DEBUG][BOOK] Fetching schedules for barber:', selectedBarber, 'date:', selectedDate, 'dayOfWeek:', dayOfWeek);
      
      // 1. Obtener horarios del barbero
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('from_time, to_time')
        .eq('barber_id', selectedBarber.toString())
        .eq('day_of_week', dayOfWeek);

      if (isCancelled) return; // No continuar si el efecto fue cancelado

      if (schedError || !schedules?.length) {
        console.log('[DEBUG][BOOK] No schedules found:', schedError);
        setAvailableTimeSlots([]);
        setAllTimeSlots([]);
        return;
      }

      // 2. Generar todos los slots posibles
      const allSlots: string[] = [];
      schedules.forEach((sch: any) => {
        let [h, m] = sch.from_time.split(':').map(Number);
        const [endH, endM] = sch.to_time.split(':').map(Number);
        
        while (h < endH || (h === endH && m < endM)) {
          allSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
          m += 30;
          if (m >= 60) { h++; m = 0; }
        }
      });

      // 3. Obtener duración del servicio
      const selectedServiceObj = services.find(s => s.id === selectedService);
      const serviceDuration = selectedServiceObj?.duration_min || 30;
      
      // 4. Verificar excepciones de horario para este día
      console.log(`[DEBUG] Checking schedule exceptions for barber ${selectedBarber} on ${selectedDate}`);
      
      const { data: scheduleExceptions } = await supabase
        .from('schedule_exceptions')
        .select('from_time, to_time')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate);

      console.log('[DEBUG] Schedule exceptions found:', scheduleExceptions);

      // Si hay una excepción que bloquea todo el día (from_time y to_time son null)
      const dayBlockedException = scheduleExceptions?.find(exc => exc.from_time === null && exc.to_time === null);
      if (dayBlockedException) {
        console.log('[DEBUG] Barber does not work on this day (full day exception)');
        setAvailableTimeSlots([]);
        setAllTimeSlots([]); // Establecer array vacío para indicar que no trabaja
        return;
      }

      // 5. Una sola consulta para obtener todas las citas del día
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const startOfDay = new Date(selectedDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log(`[DEBUG] Fetching appointments for barber ${selectedBarber} on ${selectedDate}`);
      console.log(`[DEBUG] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      
      // RPC publica: devuelve rangos ocupados sin exponer datos del cliente.
      // (la lectura directa de appointments esta bloqueada por RLS para anonimos)
      const { data: existingAppointments } = await supabase.rpc('get_busy_slots', {
        p_barber_id: selectedBarber,
        p_from: startOfDay.toISOString(),
        p_to: endOfDay.toISOString(),
      });

      console.log('[DEBUG] Existing appointments found:', existingAppointments);

      if (isCancelled) return;

      // 6. Verificar disponibilidad para cada slot
      const slotsWithAvailability: {time: string, available: boolean}[] = [];
      const availableSlots: string[] = [];
      
      for (const timeSlot of allSlots) {
        if (isCancelled) return; // Cancelar si el efecto cambió
        
        // Verificar si ya existe una cita en esta fecha y hora exacta
        let isAvailable = true;
        
        console.log(`[DEBUG] Checking availability for slot: ${timeSlot} (service duration: ${serviceDuration} min)`);
        
        // Calcular cuántos slots necesita este servicio
        const slotsNeeded = Math.ceil(serviceDuration / 30);
        console.log(`[DEBUG] Service needs ${slotsNeeded} slots (${serviceDuration} min ÷ 30 min)`);
        
        // Verificar si este slot y los siguientes están disponibles
        const currentSlotIndex = allSlots.indexOf(timeSlot);
        
        for (let i = 0; i < slotsNeeded; i++) {
          const checkSlotIndex = currentSlotIndex + i;
          
          // Verificar que no se salga del rango de slots disponibles
          if (checkSlotIndex >= allSlots.length) {
            console.log(`[DEBUG] Slot ${timeSlot} not available: extends beyond working hours`);
            isAvailable = false;
            break;
          }
          
          const checkSlot = allSlots[checkSlotIndex];
          console.log(`[DEBUG] Checking required slot ${i + 1}/${slotsNeeded}: ${checkSlot}`);
          
          // Verificar si este slot está bloqueado por una excepción de horario
          for (const exc of scheduleExceptions || []) {
            if (exc.from_time && exc.to_time) {
              // Convertir las horas a minutos para comparar más fácilmente
              const excFromMinutes = exc.from_time.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
              const excToMinutes = exc.to_time.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
              const slotMinutes = checkSlot.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
              
              if (slotMinutes >= excFromMinutes && slotMinutes < excToMinutes) {
                console.log(`[DEBUG] Slot ${checkSlot} blocked by modified schedule (${exc.from_time} - ${exc.to_time})`);
                isAvailable = false;
                break;
              }
            }
          }
          
          if (!isAvailable) break;
          
          // Verificar conflictos con citas existentes para este slot específico
          for (const apt of existingAppointments || []) {
            const existingDate = new Date(apt.date);
            
            // Extraer solo la fecha de la cita existente para comparar
            const existingDateOnly = existingDate.toISOString().split('T')[0];
            
            // Solo procesar citas del día seleccionado
            if (existingDateOnly !== selectedDate) {
              continue;
            }
            
            // Formatear la hora de la cita existente usando UTC
            const existingHours = existingDate.getUTCHours().toString().padStart(2, '0');
            const existingMinutes = existingDate.getUTCMinutes().toString().padStart(2, '0');
            const existingTime = `${existingHours}:${existingMinutes}`;
            
            // Verificar si hay conflicto con cualquiera de los slots necesarios
            if (existingTime === checkSlot) {
              console.log(`[DEBUG] Conflict found: slot ${checkSlot} is occupied by existing appointment`);
              isAvailable = false;
              break;
            }
            
            // También verificar si la cita existente se extiende hacia este slot
            const existingDuration = apt.duration_min || 30;
            const existingSlotsNeeded = Math.ceil(existingDuration / 30);
            const existingSlotIndex = allSlots.indexOf(existingTime);
            
            if (existingSlotIndex !== -1) {
              // Verificar si el slot actual está dentro del rango de la cita existente
              if (checkSlotIndex >= existingSlotIndex && checkSlotIndex < (existingSlotIndex + existingSlotsNeeded)) {
                console.log(`[DEBUG] Conflict found: slot ${checkSlot} is within range of existing ${existingDuration}min appointment at ${existingTime}`);
                isAvailable = false;
                break;
              }
            }
          }
          
          if (!isAvailable) break;
        }
        
        console.log(`[DEBUG] Slot ${timeSlot} availability: ${isAvailable ? '✅ AVAILABLE' : '❌ OCCUPIED'}`);
        
        slotsWithAvailability.push({ time: timeSlot, available: isAvailable });
        if (isAvailable) {
          availableSlots.push(timeSlot);
        }
      }

      if (!isCancelled) {
        console.log('[DEBUG][BOOK] Available slots after filtering:', availableSlots);
        setAvailableTimeSlots(availableSlots);
        setAllTimeSlots(slotsWithAvailability);
      }
    };

    fetchAvailableSlots();

    // Cleanup function para cancelar requests obsoletos
    return () => {
      isCancelled = true;
    };
  }, [selectedBarber, selectedDate, selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar campos requeridos
      if (!selectedBarbershop || !selectedBarber || !selectedService || !selectedDate || !selectedTime || !customerName || !customerEmail) {
        setError('Por favor completa todos los campos requeridos.');
        setLoading(false);
        return;
      }

      // Verificar que el horario seleccionado esté disponible
      const selectedSlot = allTimeSlots.find(slot => slot.time === selectedTime);
      if (!selectedSlot || !selectedSlot.available) {
        setError('El horario seleccionado no está disponible. Por favor selecciona otro.');
        setLoading(false);
        return;
      }

      // Buscar duración del servicio seleccionado
      const selectedServiceObj = services.find(s => s.id === selectedService);
      if (!selectedServiceObj) {
        setError('Servicio no encontrado.');
        setLoading(false);
        return;
      }

      // Crear timestamp completo
      const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;
      
      // Verificación final de disponibilidad justo antes de insertar
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const startOfDay = new Date(selectedDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Verificar excepciones de horario antes de continuar
      console.log(`[DEBUG] Final check: Verifying schedule exceptions for ${selectedDate}`);
      const { data: finalScheduleExceptions } = await supabase
        .from('schedule_exceptions')
        .select('from_time, to_time')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate);

      // Si hay una excepción que bloquea todo el día
      const dayBlocked = finalScheduleExceptions?.find(exc => exc.from_time === null && exc.to_time === null);
      if (dayBlocked) {
        console.log('[DEBUG] ❌ CONFLICT: Day is completely blocked by exception');
        setError('El barbero no trabaja en la fecha seleccionada. Por favor selecciona otra fecha.');
        setLoading(false);
        return;
      }

      // Verificar si el horario específico está bloqueado por excepciones
      for (const exc of finalScheduleExceptions || []) {
        if (exc.from_time && exc.to_time) {
          const excFromMinutes = exc.from_time.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
          const excToMinutes = exc.to_time.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
          const selectedTimeMinutes = selectedTime.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
          
          if (selectedTimeMinutes >= excFromMinutes && selectedTimeMinutes < excToMinutes) {
            console.log(`[DEBUG] ❌ CONFLICT: Time ${selectedTime} is blocked by schedule exception`);
            setError('El barbero tiene horario modificado para esa fecha y no puede atender en el horario seleccionado. Por favor selecciona otro horario.');
            setLoading(false);
            return;
          }
        }
      }
      
      const { data: existingAppointments, error: checkError } = await supabase.rpc('get_busy_slots', {
        p_barber_id: selectedBarber,
        p_from: startOfDay.toISOString(),
        p_to: endOfDay.toISOString(),
      });

      if (checkError) {
        console.error('Error checking availability:', checkError);
        setError('Error verificando disponibilidad. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      console.log(`[DEBUG] Final availability check for ${selectedTime} on ${selectedDate}`);
      console.log(`[DEBUG] Selected service duration: ${selectedServiceObj.duration_min} minutes`);
      console.log(`[DEBUG] Found ${existingAppointments?.length || 0} existing appointments`);
      
      // Calcular cuántos slots necesita este servicio
      const slotsNeeded = Math.ceil(selectedServiceObj.duration_min / 30);
      console.log(`[DEBUG] Service needs ${slotsNeeded} consecutive slots`);
      
      // Generar todos los slots para verificar disponibilidad
      const dayOfWeek = new Date(selectedDate).getDay();
      const { data: schedules } = await supabase
        .from('schedules')
        .select('from_time, to_time')
        .eq('barber_id', selectedBarber)
        .eq('day_of_week', dayOfWeek);
      
      const allSlots: string[] = [];
      if (schedules?.length) {
        schedules.forEach((sch: any) => {
          let [h, m] = sch.from_time.split(':').map(Number);
          const [endH, endM] = sch.to_time.split(':').map(Number);
          
          while (h < endH || (h === endH && m < endM)) {
            allSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            m += 30;
            if (m >= 60) { h++; m = 0; }
          }
        });
      }
      
      const currentSlotIndex = allSlots.indexOf(selectedTime);
      
      // Verificar que hay suficientes slots consecutivos disponibles
      for (let i = 0; i < slotsNeeded; i++) {
        const checkSlotIndex = currentSlotIndex + i;
        
        // Verificar que no se salga del rango
        if (checkSlotIndex >= allSlots.length) {
          console.log(`[DEBUG] ❌ CONFLICT: Service extends beyond working hours`);
          setError('El servicio seleccionado no puede completarse en el horario de trabajo. Por favor selecciona un horario más temprano.');
          setLoading(false);
          return;
        }
        
        const checkSlot = allSlots[checkSlotIndex];
        console.log(`[DEBUG] Checking required slot ${i + 1}/${slotsNeeded}: ${checkSlot}`);
        
        // Verificar conflictos para este slot específico
        for (const apt of existingAppointments || []) {
          const existingDate = new Date(apt.date);
          
          // Extraer solo la fecha de la cita existente para comparar
          const existingDateOnly = existingDate.toISOString().split('T')[0];
          
          // Solo procesar citas del día seleccionado
          if (existingDateOnly !== selectedDate) {
            continue;
          }
          
          // Formatear la hora de la cita existente usando UTC
          const existingHours = existingDate.getUTCHours().toString().padStart(2, '0');
          const existingMinutes = existingDate.getUTCMinutes().toString().padStart(2, '0');
          const existingTime = `${existingHours}:${existingMinutes}`;
          
          // Verificar conflicto directo
          if (existingTime === checkSlot) {
            console.log(`[DEBUG] ❌ CONFLICT DETECTED: Required slot ${checkSlot} is occupied`);
            setError('Lo sentimos, ese horario ya no está disponible. Por favor selecciona otro.');
            setLoading(false);
            return;
          }
          
          // Verificar si la cita existente se extiende hacia este slot
          const existingDuration = apt.duration_min || 30;
          const existingSlotsNeeded = Math.ceil(existingDuration / 30);
          const existingSlotIndex = allSlots.indexOf(existingTime);
          
          if (existingSlotIndex !== -1 && checkSlotIndex >= existingSlotIndex && checkSlotIndex < (existingSlotIndex + existingSlotsNeeded)) {
            console.log(`[DEBUG] ❌ CONFLICT DETECTED: Required slot ${checkSlot} conflicts with existing ${existingDuration}min appointment at ${existingTime}`);
            setError('Lo sentimos, ese horario ya no está disponible. Por favor selecciona otro.');
            setLoading(false);
            return;
          }
        }
      }
      
      console.log(`[DEBUG] ✅ No conflicts found, proceeding with booking`);

      console.log('[DEBUG] Inserting appointment:', {
        barber_id: selectedBarber,
        service_id: selectedService,
        date: appointmentDateTime,
        duration_min: selectedServiceObj.duration_min,
        customer_name: customerName
      });

      // Insertar la cita
      const { error } = await supabase.from('appointments').insert([
        {
          barber_id: selectedBarber,
          service_id: selectedService,
          date: appointmentDateTime,
          duration_min: selectedServiceObj.duration_min,
          status_id: 1, // Pendiente
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
        },
      ]);

      setLoading(false);

      if (error) {
        console.error('Error creating appointment:', error);
        // 23P01 = exclusion_violation: el horario fue tomado por otra reserva (race condition)
        if (error.code === '23P01') {
          const msg = 'Ese horario acaba de ser reservado por otra persona. Por favor elegí otro.';
          setError(msg);
          toast.error(msg);
        } else {
          setError('Ocurrió un error al agendar el turno. Intenta nuevamente.');
          toast.error('Ocurrió un error al agendar el turno. Intenta nuevamente.');
        }
      } else {
        toast.success(`¡Turno agendado para el ${selectedDate} a las ${selectedTime}! Te enviaremos la confirmación por email.`, { duration: 6000 });

        // Resetear formulario
        setSelectedBarbershop('');
        setSelectedBarber('');
        setSelectedService('');
        setSelectedDate('');
        setSelectedTime('');
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        
        // Refrescar disponibilidad después de reserva exitosa
        const refreshAvailability = async () => {
          if (selectedBarber && selectedDate && selectedService) {
            // Forzar refresco de horarios disponibles
            const dayOfWeek = new Date(selectedDate).getDay();
            
            // Obtener horarios del barbero
            const { data: schedules } = await supabase
              .from('schedules')
              .select('from_time, to_time')
              .eq('barber_id', selectedBarber)
              .eq('day_of_week', dayOfWeek);

            if (schedules?.length) {
              // Generar todos los slots posibles
              const allSlots: string[] = [];
              schedules.forEach((sch: any) => {
                let [h, m] = sch.from_time.split(':').map(Number);
                const [endH, endM] = sch.to_time.split(':').map(Number);
                
                while (h < endH || (h === endH && m < endM)) {
                  allSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                  m += 30;
                  if (m >= 60) { h++; m = 0; }
                }
              });

              // Obtener excepciones de horario
              const { data: scheduleExceptions } = await supabase
                .from('schedule_exceptions')
                .select('from_time, to_time')
                .eq('barber_id', selectedBarber)
                .eq('date', selectedDate);

              // Si hay una excepción que bloquea todo el día
              const dayBlockedException = scheduleExceptions?.find(exc => exc.from_time === null && exc.to_time === null);
              if (dayBlockedException) {
                console.log('[DEBUG] Refresh: Barber does not work on this day');
                setAllTimeSlots([]); // Array vacío para indicar que no trabaja
                setAvailableTimeSlots([]);
                return;
              }

              // Obtener citas existentes
              const selectedDateObj = new Date(selectedDate + 'T00:00:00');
              const startOfDay = new Date(selectedDateObj);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(selectedDateObj);
              endOfDay.setHours(23, 59, 59, 999);
              
              const { data: existingAppointments } = await supabase
                .from('appointments')
                .select('date, duration_min')
                .eq('barber_id', selectedBarber)
                .neq('status_id', 3)
                .gte('date', startOfDay.toISOString())
                .lte('date', endOfDay.toISOString());

              // Verificar disponibilidad para cada slot
              const selectedServiceObj = services.find(s => s.id === selectedService);
              const serviceDuration = selectedServiceObj?.duration_min || 30;
              
              const slotsWithAvailability: {time: string, available: boolean}[] = [];
              
              for (const timeSlot of allSlots) {
                // Verificar disponibilidad considerando la duración del servicio
                let isAvailable = true;
                
                // Calcular cuántos slots necesita este servicio
                const slotsNeeded = Math.ceil(serviceDuration / 30);
                const currentSlotIndex = allSlots.indexOf(timeSlot);
                
                // Verificar si este slot y los siguientes están disponibles
                for (let i = 0; i < slotsNeeded; i++) {
                  const checkSlotIndex = currentSlotIndex + i;
                  
                  // Verificar que no se salga del rango
                  if (checkSlotIndex >= allSlots.length) {
                    isAvailable = false;
                    break;
                  }
                  
                  const checkSlot = allSlots[checkSlotIndex];
                  
                  // Verificar si este slot está bloqueado por una excepción de horario
                  for (const exc of scheduleExceptions || []) {
                    if (exc.from_time && exc.to_time) {
                      const excFromMinutes = exc.from_time.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
                      const excToMinutes = exc.to_time.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
                      const slotMinutes = checkSlot.split(':').reduce((h, m) => h * 60 + parseInt(m), 0);
                      
                      if (slotMinutes >= excFromMinutes && slotMinutes < excToMinutes) {
                        console.log(`[DEBUG] Refresh: Slot ${checkSlot} blocked by modified schedule (${exc.from_time} - ${exc.to_time})`);
                        isAvailable = false;
                        break;
                      }
                    }
                  }
                  
                  if (!isAvailable) break;
                  
                  // Verificar conflictos con citas existentes
                  for (const apt of existingAppointments || []) {
                    const existingDate = new Date(apt.date);
                    
                    // Extraer solo la fecha de la cita existente para comparar
                    const existingDateOnly = existingDate.toISOString().split('T')[0];
                    
                    // Solo procesar citas del día seleccionado
                    if (existingDateOnly !== selectedDate) {
                      continue;
                    }
                    
                    // Formatear la hora de la cita existente usando UTC
                    const existingHours = existingDate.getUTCHours().toString().padStart(2, '0');
                    const existingMinutes = existingDate.getUTCMinutes().toString().padStart(2, '0');
                    const existingTime = `${existingHours}:${existingMinutes}`;
                    
                    // Verificar conflicto directo
                    if (existingTime === checkSlot) {
                      isAvailable = false;
                      break;
                    }
                    
                    // Verificar si la cita existente se extiende hacia este slot
                    const existingDuration = apt.duration_min || 30;
                    const existingSlotsNeeded = Math.ceil(existingDuration / 30);
                    const existingSlotIndex = allSlots.indexOf(existingTime);
                    
                    if (existingSlotIndex !== -1 && checkSlotIndex >= existingSlotIndex && checkSlotIndex < (existingSlotIndex + existingSlotsNeeded)) {
                      isAvailable = false;
                      break;
                    }
                  }
                  
                  if (!isAvailable) break;
                }
                
                slotsWithAvailability.push({ time: timeSlot, available: isAvailable });
              }
              
              setAllTimeSlots(slotsWithAvailability);
            }
          }
        };
        
        refreshAvailability();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Ocurrió un error inesperado. Intenta nuevamente.');
      setLoading(false);
    }
  };


  // Resetear barbero y servicio seleccionados cuando cambie la barbería
  const handleBarbershopChange = (barbershopId: string) => {
    setSelectedBarbershop(barbershopId);
    setSelectedBarber('');
    setSelectedService('');
    setSelectedTime('');
  };

  // Resetear servicio y tiempo seleccionados cuando cambie el barbero
  const handleBarberChange = (barberId: string) => {
    setSelectedBarber(barberId);
    setSelectedService('');
    setSelectedTime('');
  };

  // Resetear tiempo cuando cambie el servicio
  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedTime(''); // Resetear tiempo porque la duración afecta disponibilidad
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 relative overflow-hidden">
  {/* Background Elements */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-barbershop-red/8 via-red-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-barbershop-blue/6 via-blue-600/3 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-barbershop-red/2 via-transparent to-transparent rounded-full animate-pulse delay-1000"></div>
  </div>

  {/* Header */}
  <Navbar />

  {/* Main Content */}
  <main className="relative z-10 p-4 sm:p-6 lg:p-20 flex justify-center">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
          Agenda tu{' '}
          <span className="bg-gradient-to-r from-barbershop-red via-red-500 to-barbershop-blue bg-clip-text text-transparent">
            Turno
          </span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Reserva tu cita en la mejor barbería. Rápido, fácil y sin complicaciones.
        </p>
      </div>

      {/* Booking Form */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-16 hover:shadow-barbershop-red/10 transition-all duration-700">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Barbershop Selection */}
          <div className="space-y-4 sm:space-y-6">
            <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              <MapPin className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
              Selecciona la Barbería
            </label>
            <select
              value={selectedBarbershop}
              onChange={(e) => handleBarbershopChange(e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
              required
            >
              <option value="" className="bg-slate-800 text-gray-300">Selecciona una barbería</option>
              {barbershops.map((shop) => (
                <option key={shop.id} value={shop.id.toString()} className="bg-slate-800 text-white">
                  {shop.name} - {shop.address}
                </option>
              ))}
            </select>
          </div>

          {/* Barber Selection */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 lg:mb-6">
              <User className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
              Selecciona tu Barbero
            </label>
            {!selectedBarbershop ? (
              <div className="p-4 sm:p-6 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl text-center">
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg italic">Primero selecciona una barbería</p>
              </div>
            ) : (
              <>
                {/* Mobile: Select dropdown */}
                <div className="block md:hidden">
                  <select
                    value={selectedBarber}
                    onChange={(e) => handleBarberChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-barbershop-blue/50 focus:ring-2 focus:ring-barbershop-blue/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800 text-gray-300">Selecciona un barbero</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id.toString()} className="bg-slate-800 text-white">
                        {barber.users?.name || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop: Button grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      onClick={() => handleBarberChange(barber.id.toString())}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-center relative cursor-pointer backdrop-blur-sm ${
                        selectedBarber === barber.id.toString()
                          ? 'border-barbershop-blue bg-barbershop-blue/20 text-white shadow-lg shadow-barbershop-blue/30 scale-105'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-barbershop-blue/50 hover:bg-white/10'
                      }`}
                    >
                      {selectedBarber === barber.id.toString() && (
                        <div className="absolute top-4 right-4 w-4 h-4 bg-barbershop-blue rounded-full animate-pulse"></div>
                      )}
                      <h3 className="font-bold text-lg mb-3">{barber.users?.name || 'Sin nombre'}</h3>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 lg:mb-6">
              <Calendar className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
              Elige tu Servicio
            </label>
            
            {!selectedBarber ? (
              <div className="p-4 sm:p-6 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl text-center">
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg italic">Primero selecciona un barbero</p>
              </div>
            ) : (
              <>
                {/* Mobile: Select dropdown */}
                <div className="block md:hidden">
                  <select
                    value={selectedService}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white text-base focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800 text-gray-300">Selecciona un servicio</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id} className="bg-slate-800 text-white">
                        {service.name} {service.duration ? `- ${service.duration}` : ''} {service.price ? `- $${service.price}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop: Button grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceChange(service.id.toString())}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-left relative cursor-pointer backdrop-blur-sm ${
                        selectedService === service.id.toString() ? 'border-barbershop-red bg-barbershop-red/20 text-white shadow-lg shadow-barbershop-red/30 scale-105' : 'border-white/20 bg-white/5 text-gray-300 hover:border-barbershop-red/50 hover:bg-white/10'
                      }`}
                    >
                      {selectedService === service.id.toString() && (
                        <div className="absolute top-4 right-4 w-4 h-4 bg-barbershop-red rounded-full animate-pulse"></div>
                      )}
                      <h3 className="font-bold text-lg mb-3">{service.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">{service.duration}</span>
                        <span className={`font-bold text-lg ${
                          selectedService === service.id.toString() ? 'text-white' : 'text-barbershop-red'
                        }`}>{service.price ? `$${service.price}` : ''}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                <Calendar className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
                required
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className="block text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                <Clock className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-barbershop-red" />
                Horario
              </label>
              {!selectedBarber || !selectedService ? (
                <div className="p-3 sm:p-4 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl text-center">
                  <p className="text-gray-400 text-xs sm:text-sm italic">
                    {!selectedBarber ? 'Primero selecciona un barbero' : 'Selecciona un servicio'}
                  </p>
                </div>
              ) : allTimeSlots.length === 0 && selectedDate ? (
                <div className="p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg sm:rounded-xl text-center">
                  <p className="text-red-300 text-xs sm:text-sm">
                    🚫 El barbero no trabaja en la fecha seleccionada
                  </p>
                  <p className="text-red-400 text-xs mt-1">
                    Por favor selecciona otra fecha
                  </p>
                </div>
              ) : allTimeSlots.every(slot => !slot.available) && allTimeSlots.length > 0 ? (
                <div className="p-3 sm:p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg sm:rounded-xl text-center">
                  <p className="text-yellow-300 text-xs sm:text-sm">
                    ⏰ Todos los horarios están ocupados para esta fecha
                  </p>
                  <p className="text-yellow-400 text-xs mt-1">
                    Intenta con otra fecha o un servicio más corto
                  </p>
                </div>
              ) : (
                <select
                  value={selectedTime}
                  onChange={(e) => {
                    // Solo permitir seleccionar si la opción está disponible
                    const selectedSlot = allTimeSlots.find(slot => slot.time === e.target.value);
                    if (selectedSlot && selectedSlot.available) {
                      setSelectedTime(e.target.value);
                    }
                  }}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 cursor-pointer"
                  required
                >
                  <option value="" className="bg-slate-800 text-gray-300">
                    {allTimeSlots.length === 0 ? 'No hay horarios disponibles' : 'Selecciona un horario'}
                  </option>
                  {allTimeSlots.map((slot) => (
                    <option 
                      key={slot.time} 
                      value={slot.available ? slot.time : ''} 
                      disabled={!slot.available}
                      className={`bg-slate-800 ${
                        slot.available 
                          ? 'text-white hover:bg-slate-700' 
                          : 'text-gray-500 cursor-not-allowed bg-gray-800/50'
                      }`}
                    >
                      {slot.time} {!slot.available ? '(Ocupado)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <h3 className="text-white text-lg sm:text-xl font-bold">Tus Datos de Contacto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-gray-300 mb-2 sm:mb-3 text-base sm:text-lg font-medium">
                  <User className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-barbershop-red" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                  required
                />
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="block text-gray-300 mb-2 sm:mb-3 text-base sm:text-lg font-medium">
                  <Mail className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-barbershop-red" />
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                  required
                />
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Te enviaremos la confirmación del turno</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="block text-gray-300 mb-2 sm:mb-3 text-base sm:text-lg font-medium">
                  <Phone className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-barbershop-red" />
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none focus:border-barbershop-red/50 focus:ring-2 focus:ring-barbershop-red/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/30"
                  required
                />
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Para contactarte en caso de ser necesario</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl transition-all duration-500 shadow-xl group overflow-hidden relative cursor-pointer ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-barbershop-red via-red-600 to-barbershop-red text-white hover:scale-105 shadow-barbershop-red/30 hover:shadow-barbershop-red/50'
            }`}
          >
            <span className="relative z-10">
              {loading ? '⏳ Agendando...' : '🎯 Confirmar Turno'}
            </span>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            )}
          </button>
        </form>
      </div>
    </div>
  </main>

  {/* Footer */}
  <Footer />
</div>
  );
}

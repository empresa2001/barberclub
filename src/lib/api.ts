// API Configuration for Node.js + MySQL Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// API Client class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Get token from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Private method to make HTTP requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // if (this.token) {
    //   headers.Authorization = `Bearer ${this.token}`;
    // }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient();

// Auth API methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', credentials),
  
  register: (userData: { 
    email: string; 
    password: string; 
    role: 'superadmin' | 'barbershop_admin' | 'barber';
    barbershop_id?: string;
  }) =>
    apiClient.post<{ token: string; user: User }>('/auth/register', userData),
  
  logout: () => {
    apiClient.removeToken();
    return Promise.resolve();
  },
  
  verifyToken: () =>
    apiClient.get<{ user: User }>('/auth/verify'),
  
  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
};

// Barbershops API
export const barbershopsApi = {
  getAll: () => apiClient.get<Barbershop[]>('/barbershops'),
  getById: (id: string) => apiClient.get<Barbershop>(`/barbershops/${id}`),
  create: (data: Partial<Barbershop>) => apiClient.post<Barbershop>('/barbershops', data),
  update: (id: string, data: Partial<Barbershop>) => apiClient.put<Barbershop>(`/barbershops/${id}`, data),
  delete: (id: string) => apiClient.delete(`/barbershops/${id}`),
  updateStatus: (id: string, status: 'active' | 'pending' | 'suspended') => 
    apiClient.patch(`/barbershops/${id}/status`, { status }),
};

// Barbers API
export const barbersApi = {
  getAll: (barbershopId?: string) => 
    apiClient.get<Barber[]>(`/barbers${barbershopId ? `?barbershop_id=${barbershopId}` : ''}`),
  getById: (id: string) => apiClient.get<Barber>(`/barbers/${id}`),
  create: (data: Partial<Barber>) => apiClient.post<Barber>('/barbers', data),
  update: (id: string, data: Partial<Barber>) => apiClient.put<Barber>(`/barbers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/barbers/${id}`),
};

// Appointments API
export const appointmentsApi = {
  getAll: (barbershopId?: string) => 
    apiClient.get<Appointment[]>(`/appointments${barbershopId ? `?barbershop_id=${barbershopId}` : ''}`),
  getById: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`),
  create: (data: Partial<Appointment>) => apiClient.post<Appointment>('/appointments', data),
  update: (id: string, data: Partial<Appointment>) => apiClient.put<Appointment>(`/appointments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/appointments/${id}`),
  updateStatus: (id: string, status: string) => 
    apiClient.patch(`/appointments/${id}/status`, { status }),
};

// Services API
export const servicesApi = {
  getAll: (barbershopId?: string) => 
    apiClient.get<Service[]>(`/services${barbershopId ? `?barbershop_id=${barbershopId}` : ''}`),
  getById: (id: string) => apiClient.get<Service>(`/services/${id}`),
  create: (data: Partial<Service>) => apiClient.post<Service>('/services', data),
  update: (id: string, data: Partial<Service>) => apiClient.put<Service>(`/services/${id}`, data),
  delete: (id: string) => apiClient.delete(`/services/${id}`),
};

// TypeScript types for the entities
export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'barbershop_admin' | 'barber';
  barbershop_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Barbershop {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
  admin_name: string;
  admin_email: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_barbers?: number;
  total_appointments?: number;
  monthly_revenue?: number;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  barbershop_id: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  barbershop_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  barbershop_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

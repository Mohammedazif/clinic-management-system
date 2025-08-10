const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Debug: Log the API base URL
console.log('API_BASE_URL:', API_BASE_URL);

// Auth token management with robust loading
class TokenManager {
  private token: string | null = null;
  private initialized = false;

  private initialize() {
    if (!this.initialized && typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
      this.initialized = true;
      if (this.token) {
        console.log('Token initialized from localStorage');
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    this.initialized = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      // Also set as cookie for middleware access
      document.cookie = `authToken=${token}; path=/; max-age=${24 * 60 * 60}`; // 24 hours
      console.log('Token stored successfully');
    }
  }

  getToken(): string | null {
    this.initialize();
    return this.token;
  }

  clearToken() {
    this.token = null;
    this.initialized = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      // Also clear cookie
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      console.log('Token cleared successfully');
    }
  }

  hasToken(): boolean {
    this.initialize();
    return !!this.token;
  }
}

const tokenManager = new TokenManager();

export const setAuthToken = (token: string) => tokenManager.setToken(token);
export const getAuthToken = (): string | null => tokenManager.getToken();
export const clearAuthToken = () => tokenManager.clearToken();
export const hasAuthToken = (): boolean => tokenManager.hasToken();

// API request helper with enhanced token handling
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Force token refresh from localStorage on each request
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  console.log(`🔍 API Request Debug:`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Method: ${options.method || 'GET'}`);
  console.log(`  Token exists: ${!!token}`);
  console.log(`  Token preview: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(`✅ Authorization header set`);
  } else {
    console.log(`❌ NO TOKEN - Request will fail`);
    // Try to get token one more time
    const fallbackToken = getAuthToken();
    if (fallbackToken) {
      headers.Authorization = `Bearer ${fallbackToken}`;
      console.log(`✅ Fallback token found and set`);
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`  Full URL: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`  Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        console.log('🔄 Unauthorized - clearing token and redirecting');
        clearAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      throw new Error(`${response.status}: ${errorText || response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  } catch (error) {
    console.error('❌ API Request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    console.log('Raw login response:', response);
    if (response.token) {
      console.log('Setting auth token:', response.token);
      setAuthToken(response.token);
    } else {
      console.log('No token found in response');
    }
    return response;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },
};

// Doctors API
export const doctorsAPI = {
  getAll: async (filters?: {
    specialization?: string;
    status?: string;
    isActive?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.specialization) params.append('specialization', filters.specialization);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    
    const query = params.toString();
    return apiRequest(`/doctors${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/doctors/${id}`);
  },

  create: async (doctorData: {
    name: string;
    specialization: string;
    gender: string;
    location: string;
    email: string;
    phone: string;
    availability: string[];
    workingDays: string[];
    licenseNumber?: string;
    experience?: number;
    bio?: string;
    consultationFee?: number;
  }) => {
    return apiRequest('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  },

  update: async (id: string, doctorData: any) => {
    return apiRequest(`/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(doctorData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/doctors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/doctors/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiRequest('/doctors/stats');
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (filters?: {
    date?: string;
    doctorId?: string;
    status?: string;
    patientName?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.patientName) params.append('patientName', filters.patientName);
    
    const query = params.toString();
    return apiRequest(`/appointments${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/appointments/${id}`);
  },

  create: async (appointmentData: {
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAge?: number;
    patientGender?: string;
    doctorId: string;
    date: string;
    time: string;
    notes?: string;
    symptoms?: string;
  }) => {
    return apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  update: async (id: string, appointmentData: any) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(appointmentData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  cancel: async (id: string) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  reschedule: async (id: string, date: string, time: string) => {
    return apiRequest(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ date, time }),
    });
  },

  getStats: async () => {
    return apiRequest('/appointments/stats');
  },
};

// Queue API
export const queueAPI = {
  getAll: async (filters?: {
    status?: string;
    doctorId?: string;
    priority?: string;
    activeOnly?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.activeOnly !== undefined) params.append('activeOnly', filters.activeOnly.toString());
    
    const query = params.toString();
    return apiRequest(`/queue${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/queue/${id}`);
  },

  create: async (queueData: {
    patientName: string;
    patientPhone: string;
    patientAge?: number;
    priority?: string;
    reason?: string;
    notes?: string;
    doctorId?: string;
  }) => {
    return apiRequest('/queue', {
      method: 'POST',
      body: JSON.stringify(queueData),
    });
  },

  update: async (id: string, queueData: any) => {
    return apiRequest(`/queue/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(queueData),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiRequest(`/queue/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  assignDoctor: async (id: string, doctorId: string) => {
    return apiRequest(`/queue/${id}/assign-doctor`, {
      method: 'PATCH',
      body: JSON.stringify({ doctorId }),
    });
  },

  callNext: async (doctorId?: string) => {
    return apiRequest('/queue/call-next', {
      method: 'POST',
      body: JSON.stringify({ doctorId }),
    });
  },

  remove: async (id: string) => {
    return apiRequest(`/queue/${id}`, {
      method: 'DELETE',
    });
  },

  getActive: async () => {
    return apiRequest('/queue/active');
  },

  getWaiting: async () => {
    return apiRequest('/queue/waiting');
  },

  getStats: async () => {
    return apiRequest('/queue/stats');
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return apiRequest('/users');
  },

  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },

  update: async (id: string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  activate: async (id: string) => {
    return apiRequest(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  },

  deactivate: async (id: string) => {
    return apiRequest(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

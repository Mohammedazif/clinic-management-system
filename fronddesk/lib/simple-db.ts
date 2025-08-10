// Simple in-memory database for development
// In production, this would be replaced with a proper MySQL database

export interface Doctor {
  id: string
  name: string
  specialization: string
  gender: string
  location: string
  phone: string
  email: string
  availability: string[]
  workingDays: string[]
  isActive: boolean
}

export interface Appointment {
  id: string
  patientName: string
  patientPhone: string
  patientEmail: string
  doctorId: string
  doctorName: string
  date: string
  time: string
  status: 'booked' | 'completed' | 'cancelled' | 'rescheduled'
  notes: string
  symptoms: string
  diagnosis?: string
  prescription?: string
  createdAt: string
  updatedAt: string
}

export interface QueueItem {
  id: string
  queueNumber: number
  patientName: string
  patientPhone: string
  status: 'waiting' | 'with_doctor' | 'completed' | 'cancelled'
  priority: 'normal' | 'urgent'
  notes: string
  calledAt?: string
  completedAt?: string
  createdAt: string
}

export interface User {
  id: string
  username: string
  password: string
  fullName: string
  role: string
  isActive: boolean
}

// In-memory data storage
let doctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Smith',
    specialization: 'General Medicine',
    gender: 'Female',
    location: 'Room 101',
    phone: '+1234567890',
    email: 'sarah.smith@clinic.com',
    availability: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    isActive: true
  },
  {
    id: '2',
    name: 'Dr. Michael Johnson',
    specialization: 'Cardiology',
    gender: 'Male',
    location: 'Room 102',
    phone: '+1234567891',
    email: 'michael.johnson@clinic.com',
    availability: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    workingDays: ['Monday', 'Wednesday', 'Friday'],
    isActive: true
  },
  {
    id: '3',
    name: 'Dr. Emily Brown',
    specialization: 'Pediatrics',
    gender: 'Female',
    location: 'Room 103',
    phone: '+1234567892',
    email: 'emily.brown@clinic.com',
    availability: ['10:00', '11:00', '14:00', '15:00', '16:00'],
    workingDays: ['Tuesday', 'Thursday', 'Saturday'],
    isActive: true
  }
]

let appointments: Appointment[] = [
  {
    id: '1',
    patientName: 'Alice Johnson',
    patientPhone: '+1234567893',
    patientEmail: 'alice.johnson@email.com',
    doctorId: '1',
    doctorName: 'Dr. Sarah Smith',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'booked',
    notes: 'Regular checkup',
    symptoms: 'General wellness check',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    patientName: 'Bob Wilson',
    patientPhone: '+1234567894',
    patientEmail: 'bob.wilson@email.com',
    doctorId: '2',
    doctorName: 'Dr. Michael Johnson',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'completed',
    notes: 'Follow-up visit',
    symptoms: 'Chest pain follow-up',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

let queueItems: QueueItem[] = []

let users: User[] = [
  {
    id: '1',
    username: 'frontdesk',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
    fullName: 'Front Desk Staff',
    role: 'front_desk',
    isActive: true
  }
]

let appointmentCounter = 3
let queueCounter = 1

// Database operations
export const db = {
  // Doctors
  getDoctors: () => doctors.filter(d => d.isActive),
  getDoctorById: (id: string) => doctors.find(d => d.id === id),
  createDoctor: (doctor: Omit<Doctor, 'id'>) => {
    const newDoctor = { ...doctor, id: Date.now().toString() }
    doctors.push(newDoctor)
    return newDoctor
  },
  updateDoctor: (id: string, updates: Partial<Doctor>) => {
    const index = doctors.findIndex(d => d.id === id)
    if (index !== -1) {
      doctors[index] = { ...doctors[index], ...updates }
      return doctors[index]
    }
    return null
  },

  // Appointments
  getAppointments: () => appointments,
  getAppointmentById: (id: string) => appointments.find(a => a.id === id),
  getAppointmentsByDate: (date: string) => appointments.filter(a => a.date === date),
  getAppointmentsByDoctor: (doctorId: string) => appointments.filter(a => a.doctorId === doctorId),
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newAppointment = {
      ...appointment,
      id: (appointmentCounter++).toString(),
      createdAt: now,
      updatedAt: now
    }
    appointments.push(newAppointment)
    return newAppointment
  },
  updateAppointment: (id: string, updates: Partial<Appointment>) => {
    const index = appointments.findIndex(a => a.id === id)
    if (index !== -1) {
      appointments[index] = { 
        ...appointments[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      }
      return appointments[index]
    }
    return null
  },
  deleteAppointment: (id: string) => {
    const index = appointments.findIndex(a => a.id === id)
    if (index !== -1) {
      return appointments.splice(index, 1)[0]
    }
    return null
  },

  // Queue
  getQueue: () => queueItems.sort((a, b) => {
    if (a.priority === 'urgent' && b.priority === 'normal') return -1
    if (a.priority === 'normal' && b.priority === 'urgent') return 1
    return a.queueNumber - b.queueNumber
  }),
  getQueueItem: (id: string) => queueItems.find(q => q.id === id),
  addToQueue: (item: Omit<QueueItem, 'id' | 'queueNumber' | 'createdAt'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      queueNumber: queueCounter++,
      createdAt: new Date().toISOString()
    }
    queueItems.push(newItem)
    return newItem
  },
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => {
    const index = queueItems.findIndex(q => q.id === id)
    if (index !== -1) {
      queueItems[index] = { ...queueItems[index], ...updates }
      return queueItems[index]
    }
    return null
  },

  // Users
  getUserByUsername: (username: string) => users.find(u => u.username === username),
  getUserById: (id: string) => users.find(u => u.id === id)
}

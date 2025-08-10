"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Plus, CheckCircle, XCircle, User, Clock, Edit, AlertTriangle, Phone, Mail, MapPin, Stethoscope, FileText, Shield } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'
import { appointmentsAPI, doctorsAPI } from '@/lib/api'

interface Appointment {
  id: string
  patientName: string
  patientPhone: string
  patientEmail: string
  patientAge?: number
  patientGender?: string
  patientAddress?: string
  emergencyContact?: string
  emergencyPhone?: string
  doctorId: string
  doctorName?: string
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  appointmentType?: 'consultation' | 'follow-up' | 'emergency' | 'checkup'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
  symptoms?: string
  medicalHistory?: string
  currentMedications?: string
  allergies?: string
  insuranceProvider?: string
  insuranceNumber?: string
  consultationFee?: number
  isFollowUp?: boolean
  followUpDate?: string
  createdAt?: string
  updatedAt?: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
  gender: 'male' | 'female' | 'other'
  location: string
  phone: string
  email: string
  availability: string[]
  workingDays: string[]
  consultationDuration: number
  consultationFee?: number
  licenseNumber?: string
  experience?: number
  bio?: string
  isActive: boolean
  status?: 'available' | 'busy' | 'offline'
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('')
  const [showTodayOnly, setShowTodayOnly] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [conflictingAppointments, setConflictingAppointments] = useState<Appointment[]>([])
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: undefined as number | undefined,
    patientGender: 'male' as 'male' | 'female' | 'other',
    patientAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    appointmentType: 'consultation' as 'consultation' | 'follow-up' | 'emergency' | 'checkup',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    notes: '',
    symptoms: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    insuranceProvider: '',
    insuranceNumber: ''
  })

  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [dateFilter, doctorFilter, statusFilter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (dateFilter) filters.date = dateFilter
      if (doctorFilter && doctorFilter !== 'all') filters.doctorId = doctorFilter
      if (statusFilter && statusFilter !== 'all') filters.status = statusFilter
      
      const data = await appointmentsAPI.getAll(filters)
      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const data = await doctorsAPI.getAll({ isActive: true })
      setDoctors(data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  // Check doctor availability for a specific date
  const checkDoctorAvailability = async (doctorId: string, date: string) => {
    const doctor = doctors.find(d => d.id === doctorId)
    if (!doctor) {
      setAvailableSlots([])
      return []
    }

    // Fix timezone issue by parsing date correctly
    const [year, month, day] = date.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Check if doctor works on this day
    if (!doctor.workingDays.includes(dayOfWeek)) {
      setAvailableSlots([])
      return []
    }

    // Get existing appointments for this doctor on this date
    const existingAppointments = appointments.filter(
      apt => apt.doctorId === doctorId && 
             apt.date === date && 
             ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
    )

    // Calculate available slots
    const availableSlots = doctor.availability.filter(slot => {
      const isBooked = existingAppointments.some(apt => apt.time === slot)
      return !isBooked
    })

    setAvailableSlots(availableSlots)
    return availableSlots
  }

  // Check for scheduling conflicts
  const checkScheduleConflicts = async (doctorId: string, date: string, time: string, excludeAppointmentId?: string) => {
    const conflicts = appointments.filter(
      apt => apt.doctorId === doctorId && 
             apt.date === date && 
             apt.time === time && 
             ['scheduled', 'confirmed', 'in_progress'].includes(apt.status) &&
             apt.id !== excludeAppointmentId
    )
    
    setConflictingAppointments(conflicts)
    return conflicts.length > 0
  }

  // Start rescheduling process
  const startRescheduling = async (appointment: Appointment) => {
    setReschedulingAppointment(appointment)
    const appointmentData = {
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: appointment.patientEmail,
      patientAge: typeof appointment.patientAge === 'string' ? parseInt(appointment.patientAge) : appointment.patientAge,
      patientGender: (appointment.patientGender as 'male' | 'female' | 'other') || 'male',
      patientAddress: appointment.patientAddress || '',
      emergencyContact: appointment.emergencyContact || '',
      emergencyPhone: appointment.emergencyPhone || '',
      doctorId: appointment.doctorId,
      date: appointment.date,
      time: appointment.time,
      appointmentType: appointment.appointmentType || 'consultation',
      priority: appointment.priority || 'normal',
      notes: appointment.notes || '',
      symptoms: appointment.symptoms || '',
      medicalHistory: appointment.medicalHistory || '',
      currentMedications: appointment.currentMedications || '',
      allergies: appointment.allergies || '',
      insuranceProvider: appointment.insuranceProvider || '',
      insuranceNumber: appointment.insuranceNumber || ''
    }
    
    setNewAppointment(appointmentData)
    setIsRescheduling(true)
    setCurrentStep(3) // Start from appointment details step for rescheduling
    
    // Load available slots for the current doctor and date
    if (appointment.doctorId && appointment.date) {
      await checkDoctorAvailability(appointment.doctorId, appointment.date)
    }
  }

  // Reschedule appointment
  const rescheduleAppointment = async () => {
    if (!reschedulingAppointment) return

    try {
      setLoading(true)
      
      // Final validation
      const isValid = await validateStep(3)
      if (!isValid) return
      
      await appointmentsAPI.update(reschedulingAppointment.id, {
        ...newAppointment,
        doctorName: doctors.find(d => d.id === newAppointment.doctorId)?.name || ''
      })
      
      // Reset and close
      resetForm()
      setIsRescheduling(false)
      setReschedulingAppointment(null)
      fetchAppointments()
      
      alert('Appointment rescheduled successfully!')
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      alert('Failed to reschedule appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step validation functions
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        if (!newAppointment.patientName.trim()) {
          alert('Please enter patient name')
          return false
        }
        if (!newAppointment.patientPhone.trim()) {
          alert('Please enter phone number')
          return false
        }
        if (!newAppointment.patientEmail.trim()) {
          alert('Please enter email address')
          return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newAppointment.patientEmail)) {
          alert('Please enter a valid email address')
          return false
        }
        return true
      
      case 2:
        // Medical details are optional
        return true
      
      case 3:
        if (!newAppointment.doctorId) {
          alert('Please select a doctor')
          return false
        }
        if (!newAppointment.time) {
          alert('Please select appointment time')
          return false
        }
        
        const hasConflicts = await checkScheduleConflicts(
          newAppointment.doctorId,
          newAppointment.date,
          newAppointment.time,
          isRescheduling ? reschedulingAppointment?.id : undefined
        )
        
        if (hasConflicts) {
          alert('This time slot is already booked. Please select another time.')
          return false
        }
        return true
      
      default:
        return true
    }
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Reset appointment form
  const resetForm = () => {
    setNewAppointment({
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      patientAge: undefined,
      patientGender: 'male',
      patientAddress: '',
      emergencyContact: '',
      emergencyPhone: '',
      doctorId: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      appointmentType: 'consultation',
      priority: 'normal',
      notes: '',
      symptoms: '',
      medicalHistory: '',
      currentMedications: '',
      allergies: '',
      insuranceProvider: '',
      insuranceNumber: ''
    })
    setCurrentStep(1)
    setAvailableSlots([])
    setConflictingAppointments([])
  }

  const bookAppointment = async () => {
    try {
      setLoading(true)
      
      // Final validation
      const isValid = await validateStep(3)
      if (!isValid) return
      
      // Convert and clean data for API
      const appointmentData = {
        patientName: newAppointment.patientName,
        patientPhone: newAppointment.patientPhone,
        patientEmail: newAppointment.patientEmail,
        patientAge: newAppointment.patientAge,
        patientGender: newAppointment.patientGender,
        patientAddress: newAppointment.patientAddress,
        emergencyContact: newAppointment.emergencyContact,
        emergencyPhone: newAppointment.emergencyPhone,
        doctorId: newAppointment.doctorId,
        date: newAppointment.date,
        time: newAppointment.time,
        appointmentType: newAppointment.appointmentType,
        priority: newAppointment.priority,
        notes: newAppointment.notes,
        symptoms: newAppointment.symptoms,
        medicalHistory: newAppointment.medicalHistory,
        currentMedications: newAppointment.currentMedications,
        allergies: newAppointment.allergies,
        insuranceProvider: newAppointment.insuranceProvider,
        insuranceNumber: newAppointment.insuranceNumber
      }
      
      await appointmentsAPI.create(appointmentData)
      
      // Reset and close
      resetForm()
      setIsBooking(false)
      fetchAppointments()
      
      alert('Appointment booked successfully!')
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      await appointmentsAPI.updateStatus(id, status)
      fetchAppointments()
    } catch (error) {
      console.error('Failed to update appointment:', error)
    }
  }

  // Handle doctor selection change - check availability
  const handleDoctorChange = async (doctorId: string) => {
    setNewAppointment(prev => {
      const updated = { ...prev, doctorId, time: '' }
      // Check availability after state update
      if (doctorId && updated.date) {
        checkDoctorAvailability(doctorId, updated.date)
      }
      return updated
    })
  }

  // Handle date change - check availability
  const handleDateChange = async (date: string) => {
    setNewAppointment(prev => {
      const updated = { ...prev, date, time: '' }
      // Check availability after state update
      if (updated.doctorId && date) {
        checkDoctorAvailability(updated.doctorId, date)
      }
      return updated
    })
  }

  // Filter out old appointments (completed/cancelled appointments that are past their date)
  const currentAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    // Keep all scheduled, confirmed, in_progress appointments regardless of date
    if (['scheduled', 'confirmed', 'in_progress'].includes(appointment.status)) {
      return true
    }
    
    // For completed/cancelled appointments, only keep if they're from today or future
    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      return appointmentDate >= today
    }
    
    return true
  })

  // Enhanced filtering with all options
  const filteredAppointments = currentAppointments.filter(appointment => {
    const today = new Date().toISOString().split('T')[0]
    
    const matchesDate = !dateFilter || appointment.date === dateFilter
    const matchesDoctor = !doctorFilter || doctorFilter === 'all' || appointment.doctorId === doctorFilter
    const matchesStatus = !statusFilter || statusFilter === 'all' || appointment.status === statusFilter
    const matchesPriority = !priorityFilter || priorityFilter === 'all' || appointment.priority === priorityFilter
    const matchesType = !appointmentTypeFilter || appointmentTypeFilter === 'all' || appointment.appointmentType === appointmentTypeFilter
    const matchesToday = !showTodayOnly || appointment.date === today
    const matchesSearch = !searchQuery || 
      appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.patientPhone.includes(searchQuery) ||
      (appointment.patientEmail && appointment.patientEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (appointment.symptoms && appointment.symptoms.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (appointment.notes && appointment.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesDate && matchesDoctor && matchesStatus && matchesPriority && matchesType && matchesToday && matchesSearch
  })

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date + ' ' + a.time)
        bValue = new Date(b.date + ' ' + b.time)
        break
      case 'patient':
        aValue = a.patientName.toLowerCase()
        bValue = b.patientName.toLowerCase()
        break
      case 'doctor':
        aValue = doctors.find(d => d.id === a.doctorId)?.name?.toLowerCase() || ''
        bValue = doctors.find(d => d.id === b.doctorId)?.name?.toLowerCase() || ''
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'priority':
        const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 }
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        break
      default:
        aValue = a.date
        bValue = b.date
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Refresh page data
  const refreshPage = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchAppointments(),
        fetchDoctors()
      ])
    } catch (error) {
      console.error('Error refreshing page:', error)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced statistics
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = currentAppointments.filter(apt => apt.date === today).length
  const scheduledAppointments = currentAppointments.filter(apt => apt.status === 'scheduled').length
  const completedAppointments = currentAppointments.filter(apt => apt.status === 'completed').length
  const cancelledAppointments = currentAppointments.filter(apt => apt.status === 'cancelled').length
  const urgentAppointments = currentAppointments.filter(apt => apt.priority === 'urgent').length
  const upcomingAppointments = currentAppointments.filter(apt => {
    const aptDate = new Date(apt.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate > today && ['scheduled', 'confirmed'].includes(apt.status)
  }).length
  const inProgressAppointments = currentAppointments.filter(apt => apt.status === 'in_progress').length
  const noShowAppointments = currentAppointments.filter(apt => apt.status === 'no_show').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
            <p className="text-gray-600">Manage patient appointments and scheduling</p>
          </div>
          
          <Button
            onClick={() => {
              resetForm()
              setIsBooking(true)
              setIsRescheduling(false)
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Book New Appointment
          </Button>
        </div>

        {/* Booking/Rescheduling Dialog */}
        <Dialog open={isBooking || isRescheduling} onOpenChange={(open) => {
                if (!open) {
                  resetForm()
                  setIsBooking(false)
                  setIsRescheduling(false)
                  setReschedulingAppointment(null)
                }
              }}>
                <DialogContent className="w-full max-w-lg mx-auto bg-white border border-gray-200 shadow-xl rounded-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader className="pb-4 border-b border-gray-100">
                    <DialogTitle className="text-xl font-semibold text-gray-800">
                      {isRescheduling ? 'Reschedule Appointment' : 'Book New Appointment'}
                    </DialogTitle>
                    
                    {/* Progress Steps */}
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4].map((step) => (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              currentStep >= step 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              {step}
                            </div>
                            {step < 4 && (
                              <div className={`w-6 h-0.5 mx-1 ${
                                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Step {currentStep} of 4
                    </p>
                  </DialogHeader>
                  
                  <div className="p-6">
                      {/* Step 1: Patient Information */}
                      {currentStep === 1 && (
                        <div className="space-y-4">
                          <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Patient Information</h3>
                            <p className="text-sm text-gray-600">Enter the patient's basic details</p>
                          </div>
                          
                          <div className="space-y-4">
                          <div>
                            <Label htmlFor="patientName" className="text-sm font-medium text-gray-600 mb-2 block">
                              Patient Name *
                            </Label>
                            <Input
                              id="patientName"
                              value={newAppointment.patientName}
                              onChange={(e) => setNewAppointment({...newAppointment, patientName: e.target.value})}
                              placeholder="Enter full name"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 bg-white"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="patientAge" className="text-sm font-medium text-gray-600 mb-2 block">
                              Age
                            </Label>
                            <Input
                              id="patientAge"
                              type="number"
                              value={newAppointment.patientAge?.toString() || ''}
                              onChange={(e) => setNewAppointment({...newAppointment, patientAge: e.target.value ? parseInt(e.target.value) : undefined})}
                              placeholder="Enter age (e.g., 25)"
                              min="0"
                              max="120"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 bg-white"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="patientPhone" className="text-sm font-medium text-gray-600 mb-2 block">
                              Phone Number *
                            </Label>
                            <Input
                              id="patientPhone"
                              type="tel"
                              value={newAppointment.patientPhone}
                              onChange={(e) => setNewAppointment({...newAppointment, patientPhone: e.target.value})}
                              placeholder="+1 (555) 123-4567"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 bg-white"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="patientEmail" className="text-sm font-medium text-gray-600 mb-2 block">
                              Email Address *
                            </Label>
                            <Input
                              id="patientEmail"
                              type="email"
                              value={newAppointment.patientEmail}
                              onChange={(e) => setNewAppointment({...newAppointment, patientEmail: e.target.value})}
                              placeholder="patient@example.com"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 bg-white"
                            />
                          </div>

                          <div>
                            <Label htmlFor="patientGender" className="text-sm font-medium text-gray-600 mb-2 block">
                              Gender
                            </Label>
                            <Select value={newAppointment.patientGender} onValueChange={(value: 'male' | 'female' | 'other') => setNewAppointment({...newAppointment, patientGender: value})}>
                              <SelectTrigger className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700">
                                <SelectValue placeholder="Select gender" className="text-gray-500" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700 mb-2 block">
                              Emergency Contact
                            </Label>
                            <Input
                              id="emergencyContact"
                              value={newAppointment.emergencyContact}
                              onChange={(e) => setNewAppointment({...newAppointment, emergencyContact: e.target.value})}
                              placeholder="Emergency contact name"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor="patientAddress" className="text-sm font-medium text-gray-700 mb-2 block">
                              Address
                            </Label>
                            <Input
                              id="patientAddress"
                              value={newAppointment.patientAddress}
                              onChange={(e) => setNewAppointment({...newAppointment, patientAddress: e.target.value})}
                              placeholder="Full address"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Medical Details */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Medical Details</h3>
                          <p className="text-sm text-gray-600">Describe symptoms and additional information</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="symptoms" className="text-sm font-medium text-gray-600 mb-2 block">
                              Current Symptoms
                            </Label>
                            <textarea
                              id="symptoms"
                              value={newAppointment.symptoms}
                              onChange={(e) => setNewAppointment({...newAppointment, symptoms: e.target.value})}
                              placeholder="Describe current symptoms or concerns"
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 placeholder:text-gray-400 bg-white"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="notes" className="text-sm font-medium text-gray-600 mb-2 block">
                              Additional Details
                            </Label>
                            <textarea
                              id="notes"
                              value={newAppointment.notes}
                              onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                              placeholder="Any special instructions, additional symptoms, or relevant information"
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 placeholder:text-gray-400 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Appointment Details */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Appointment Details</h3>
                          <p className="text-sm text-gray-600">Select doctor, date and time</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="appointmentType" className="text-sm font-medium text-gray-700 mb-2 block">
                                Appointment Type
                              </Label>
                              <Select value={newAppointment.appointmentType} onValueChange={(value: 'consultation' | 'follow-up' | 'emergency' | 'checkup') => setNewAppointment({...newAppointment, appointmentType: value})}>
                                <SelectTrigger className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                  <SelectValue placeholder="Select appointment type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                  <SelectItem value="follow-up">Follow-up</SelectItem>
                                  <SelectItem value="checkup">Regular Checkup</SelectItem>
                                  <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="priority" className="text-sm font-medium text-gray-700 mb-2 block">
                                Priority Level
                              </Label>
                              <Select value={newAppointment.priority} onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => setNewAppointment({...newAppointment, priority: value})}>
                                <SelectTrigger className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                                  <SelectItem value="low">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Low Priority
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="normal">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      Normal Priority
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="high">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                      High Priority
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="urgent">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      Urgent
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="doctorId" className="text-sm font-medium text-gray-600 mb-2 block">
                              Select Doctor *
                            </Label>
                            <Select value={newAppointment.doctorId} onValueChange={handleDoctorChange}>
                              <SelectTrigger className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                <SelectValue placeholder="Choose a doctor">
                                  {newAppointment.doctorId && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700">{(() => {
                                        const doctor = doctors.find(d => d.id === newAppointment.doctorId);
                                        return doctor?.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor?.name}`;
                                      })()}</span>
                                      <span className="text-sm text-gray-500">- {doctors.find(d => d.id === newAppointment.doctorId)?.specialization}</span>
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                                {doctors.map((doctor) => (
                                  <SelectItem key={doctor.id} value={doctor.id} className="px-3 py-2 hover:bg-gray-50">
                                    <div className="flex items-center justify-between w-full">
                                      <div>
                                        <div className="font-medium text-gray-700">{doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}</div>
                                        <div className="text-sm text-gray-500">{doctor.specialization}</div>
                                        <div className="text-xs text-gray-400">{doctor.location}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {doctor.consultationFee && (
                                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                            ${doctor.consultationFee}
                                          </span>
                                        )}
                                        <div className={`w-2 h-2 rounded-full ${
                                          doctor.status === 'available' ? 'bg-green-500' :
                                          doctor.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="date" className="text-sm font-medium text-gray-600 mb-2 block">
                              Appointment Date *
                            </Label>
                            <Input
                              id="date"
                              type="date"
                              value={newAppointment.date}
                              onChange={(e) => {
                                setNewAppointment({...newAppointment, date: e.target.value})
                                if (newAppointment.doctorId) {
                                  handleDateChange(e.target.value)
                                }
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            />
                          </div>
                                                    <div>
                            <Label htmlFor="time" className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                              Appointment Time *
                              {newAppointment.doctorId && newAppointment.date && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                  {availableSlots.length} slots available
                                </span>
                              )}
                            </Label>
                            
                            {/* Show availability message */}
                            {newAppointment.doctorId && newAppointment.date && availableSlots.length === 0 && (
                              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm text-yellow-700">
                                  No available slots for this doctor on selected date
                                </span>
                              </div>
                            )}

                            {/* Show conflicts warning */}
                            {conflictingAppointments.length > 0 && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-700">
                                  This time slot is already booked
                                </span>
                              </div>
                            )}
                            
                            <Select 
                              value={newAppointment.time} 
                              onValueChange={(value) => setNewAppointment({...newAppointment, time: value})}
                              disabled={!newAppointment.doctorId || !newAppointment.date || availableSlots.length === 0}
                            >
                              <SelectTrigger className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700">
                                <SelectValue placeholder={
                                  !newAppointment.doctorId ? "Select doctor first" :
                                  !newAppointment.date ? "Select date first" :
                                  availableSlots.length === 0 ? "No available slots" :
                                  "Select available time"
                                } />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg">
                                {availableSlots.map((time) => (
                                  <SelectItem key={time} value={time} className="px-3 py-2 hover:bg-gray-50">
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium text-gray-900">{time}</span>
                                      <Clock className="w-4 h-4 text-green-500" />
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Step 4: Review & Confirm */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Review & Confirm</h3>
                          <p className="text-sm text-gray-600">Please review all information before booking the appointment</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Patient Information */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Patient Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{newAppointment.patientName || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Age:</span> <span className="font-medium">{newAppointment.patientAge || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Gender:</span> <span className="font-medium capitalize">{newAppointment.patientGender}</span></div>
                                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{newAppointment.patientPhone || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{newAppointment.patientEmail || 'Not provided'}</span></div>
                                {newAppointment.emergencyContact && (
                                  <div><span className="text-gray-500">Emergency Contact:</span> <span className="font-medium">{newAppointment.emergencyContact}</span></div>
                                )}
                              </div>
                            </div>

                            {/* Appointment Details */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Appointment Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Doctor:</span> <span className="font-medium">{(() => {
                                  const doctor = doctors.find(d => d.id === newAppointment.doctorId);
                                  if (!doctor) return 'Not selected';
                                  return doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
                                })()}</span></div>
                                <div><span className="text-gray-500">Specialization:</span> <span className="font-medium">{doctors.find(d => d.id === newAppointment.doctorId)?.specialization || 'N/A'}</span></div>
                                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{(() => {
                                  const [year, month, day] = newAppointment.date.split('-').map(Number)
                                  const localDate = new Date(year, month - 1, day)
                                  return localDate.toLocaleDateString()
                                })()}</span></div>
                                <div><span className="text-gray-500">Time:</span> <span className="font-medium">{newAppointment.time || 'Not selected'}</span></div>
                                <div><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{newAppointment.appointmentType}</span></div>
                                <div>
                                  <span className="text-gray-500">Priority:</span> 
                                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    newAppointment.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                    newAppointment.priority === 'high' ? 'bg-yellow-100 text-yellow-700' :
                                    newAppointment.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {newAppointment.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Medical Information */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Medical Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                {newAppointment.symptoms && <div><span className="text-gray-500">Symptoms:</span> <span className="font-medium">{newAppointment.symptoms}</span></div>}
                                {newAppointment.notes && <div><span className="text-gray-500">Additional Details:</span> <span className="font-medium">{newAppointment.notes}</span></div>}
                                {!newAppointment.symptoms && !newAppointment.notes && (
                                  <div className="text-gray-400 italic">No medical information provided</div>
                                )}
                              </div>
                            </div>
                          </div>


                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <div>
                      {currentStep > 1 && (
                        <button 
                          onClick={prevStep}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                        >
                          ← Back
                        </button>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => {
                          setIsBooking(false)
                          setIsRescheduling(false)
                          setReschedulingAppointment(null)
                          setCurrentStep(1)
                          setAvailableSlots([])
                          setConflictingAppointments([])
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      
                      {currentStep < 4 ? (
                        <button 
                          onClick={nextStep}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
                        >
                          Next →
                        </button>
                      ) : (
                        <button 
                          onClick={isRescheduling ? rescheduleAppointment : bookAppointment}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200"
                        >
                          {isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
                        </button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {todayAppointments}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {scheduledAppointments}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {inProgressAppointments}
                </p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <User className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {completedAppointments}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Urgent</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {urgentAppointments}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {upcomingAppointments}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-3">
            <div className="flex gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                <User className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              </div>
              
              {/* Today Only Button */}
              <button
                onClick={() => setShowTodayOnly(!showTodayOnly)}
                className={`w-20 h-8 px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                  showTodayOnly 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              
              {/* Date */}
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40 h-8 px-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              
              {/* Doctor */}
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-44 h-8 bg-white text-sm">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
              {/* Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 bg-white text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Priority */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 h-8 bg-white text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 h-8 bg-white text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-10 h-8 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              
              {/* Clear Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setDateFilter('')
                  setDoctorFilter('all')
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setAppointmentTypeFilter('all')
                  setShowTodayOnly(false)
                  setSortBy('date')
                  setSortOrder('asc')
                }}
                className="w-16 h-8 px-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Appointments Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
            <p className="text-gray-600 mt-1">Manage all patient appointments</p>
          </div>
          <div className="p-6">
            {/* Results Summary */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{sortedAppointments.length}</span> of <span className="font-medium">{currentAppointments.length}</span> appointments
                {showTodayOnly && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Today Only</span>}
              </div>
              {sortedAppointments.length > 0 && (
                <div className="text-sm text-gray-500">
                  Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
                </div>
              )}
            </div>
            
            {sortedAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No appointments found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or book a new appointment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAppointments.map((appointment) => {
                  const doctor = doctors.find(d => d.id === appointment.doctorId)
                  return (
                    <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        {/* Patient Info */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{appointment.patientName}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {appointment.patientPhone}
                              </div>
                              {appointment.patientEmail && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {appointment.patientEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Doctor Info */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{doctor?.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor?.name}`}</p>
                              <p className="text-xs text-blue-600">{doctor?.specialization}</p>
                            </div>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {(() => {
                                  const [year, month, day] = appointment.date.split('-').map(Number)
                                  const localDate = new Date(year, month - 1, day)
                                  return localDate.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                })()} at {appointment.time}
                              </p>
                              <p className="text-xs text-green-600 capitalize">{appointment.appointmentType || 'Consultation'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status & Priority */}
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            appointment.priority === 'high' ? 'bg-yellow-100 text-yellow-700' :
                            appointment.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {appointment.priority || 'Normal'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            appointment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        {appointment.status === 'scheduled' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => startRescheduling(appointment)}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Medical Information - Collapsible */}
                      {(appointment.symptoms || appointment.notes) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {appointment.symptoms && (
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">SYMPTOMS</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">{appointment.symptoms}</p>
                              </div>
                            )}
                            {appointment.notes && (
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">NOTES</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">{appointment.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

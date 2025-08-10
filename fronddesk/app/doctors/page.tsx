"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, User, MapPin, Phone, Mail, Clock, Award, DollarSign, Calendar, Users, UserCheck, UserX, X, Stethoscope } from 'lucide-react'
import { doctorsAPI } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import DashboardLayout from '@/components/dashboard-layout'

interface Doctor {
  id: string
  name: string
  specialization: string
  gender: 'male' | 'female' | 'other'
  location: string
  availability: string[]
  workingDays: string[]
  status: 'available' | 'busy' | 'offline'
  phone: string
  email: string
  licenseNumber?: string
  experience?: number
  bio?: string
  consultationFee?: number
  consultationDuration?: number
  isActive: boolean
}

// Helper functions for time formatting
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`
}

const addMinutes = (time: string, minutesToAdd: number) => {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + minutesToAdd
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMinutes = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
}

// Function to create time ranges from selected slots
const createTimeRanges = (availability: string[], duration: number = 30) => {
  if (!availability.length) return []
  if (!duration || duration <= 0) return []
  
  const sortedTimes = [...availability].sort()
  const ranges: string[] = []
  
  // Group time slots - only split on large gaps (more than 1 hour)
  let currentGroup: string[] = [sortedTimes[0]]
  
  for (let i = 1; i < sortedTimes.length; i++) {
    const currentTime = sortedTimes[i]
    const previousTime = sortedTimes[i - 1]
    
    // Check if there's a large gap (more than 1 hour = lunch break, etc.)
    const timeDiff = getTimeDifferenceInMinutes(previousTime, currentTime)
    
    if (timeDiff <= 60) { // Gaps of 1 hour or less are considered continuous
      // Part of the same session, add to current group
      currentGroup.push(currentTime)
    } else {
      // Large gap found (lunch break, etc.), finalize current group and start new one
      const groupStart = currentGroup[0]
      const groupEnd = addMinutes(currentGroup[currentGroup.length - 1], duration)
      ranges.push(`${formatTime(groupStart)}-${formatTime(groupEnd)}`)
      
      // Start new group
      currentGroup = [currentTime]
    }
  }
  
  // Add the last group
  if (currentGroup.length > 0) {
    const groupStart = currentGroup[0]
    const groupEnd = addMinutes(currentGroup[currentGroup.length - 1], duration)
    ranges.push(`${formatTime(groupStart)}-${formatTime(groupEnd)}`)
  }
  
  return ranges
}

// Helper function to calculate time difference in minutes
const getTimeDifferenceInMinutes = (time1: string, time2: string) => {
  const [hours1, minutes1] = time1.split(':').map(Number)
  const [hours2, minutes2] = time2.split(':').map(Number)
  const totalMinutes1 = hours1 * 60 + minutes1
  const totalMinutes2 = hours2 * 60 + minutes2
  return totalMinutes2 - totalMinutes1
}

// Helper function to check if doctor is currently on schedule
const isDoctorCurrentlyAvailable = (doctor: Doctor) => {
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
  
  // Check if today is a working day
  if (!doctor.workingDays.includes(currentDay)) {
    return false
  }
  
  // Check if current time falls within availability slots
  if (!doctor.availability || doctor.availability.length === 0) {
    return false
  }
  
  // Convert current time to minutes for comparison
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number)
  const currentTotalMinutes = currentHours * 60 + currentMinutes
  
  // Sort availability slots to find the working time range
  const sortedSlots = [...doctor.availability].sort()
  
  if (sortedSlots.length === 0) {
    return false
  }
  
  // Find the earliest start time and latest end time
  const firstSlot = sortedSlots[0]
  const lastSlot = sortedSlots[sortedSlots.length - 1]
  
  const [firstHours, firstMinutes] = firstSlot.split(':').map(Number)
  const startMinutes = firstHours * 60 + firstMinutes
  
  const [lastHours, lastMinutes] = lastSlot.split(':').map(Number)
  const endMinutes = lastHours * 60 + lastMinutes + (doctor.consultationDuration || 30)
  
  // Check if current time is within the working hours range
  return currentTotalMinutes >= startMinutes && currentTotalMinutes <= endMinutes
}

// Helper function to get effective doctor status (auto-offline if off schedule)
const getEffectiveDoctorStatus = (doctor: Doctor): Doctor['status'] => {
  if (!isDoctorCurrentlyAvailable(doctor)) {
    return 'offline'
  }
  return doctor.status
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isAddingDoctor, setIsAddingDoctor] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialization: '',
    gender: 'male' as 'male' | 'female' | 'other',
    location: '',
    phone: '',
    email: '',
    availability: [] as string[],
    workingDays: [] as string[],
    licenseNumber: '',
    experience: undefined as number | undefined,
    bio: '',
    consultationFee: undefined as number | undefined,
    consultationDuration: 30 as number
  })

  // Wizard navigation functions
  const handleNextStep = () => {
    if (canProceedToNextStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleCloseWizard = () => {
    resetWizard()
    setIsAddingDoctor(false)
  }

  const resetWizard = () => {
    setCurrentStep(1)
    setNewDoctor({
      name: '',
      specialization: '',
      gender: 'male' as 'male' | 'female' | 'other',
      location: '',
      phone: '',
      email: '',
      availability: [] as string[],
      workingDays: [] as string[],
      licenseNumber: '',
      experience: undefined as number | undefined,
      bio: '',
      consultationFee: undefined as number | undefined,
      consultationDuration: 30 as number
    })
  }

  // Step validation function
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        // Basic Information - require name, specialization, gender, and consultation duration
        return !!(newDoctor.name && newDoctor.specialization && newDoctor.gender && newDoctor.consultationDuration)
      case 2:
        // Contact & Professional Details - require phone and email
        return !!(newDoctor.phone && newDoctor.email)
      case 3:
        // Schedule & Availability - require at least one working day and one time slot
        return newDoctor.workingDays.length > 0 && newDoctor.availability.length > 0
      case 4:
        // Review & Confirm - all previous validations should pass
        return !!(
          newDoctor.name && 
          newDoctor.specialization && 
          newDoctor.phone && 
          newDoctor.email &&
          newDoctor.workingDays.length > 0 && 
          newDoctor.availability.length > 0
        )
      default:
        return false
    }
  }



  useEffect(() => {
    fetchDoctors()
  }, [])

  // Auto-update doctor status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      autoUpdateDoctorStatus()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [doctors])

  const fetchDoctors = async () => {
    try {
      const data = await doctorsAPI.getAll()
      setDoctors(data)
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    }
  }

  const addDoctor = async () => {
    try {
      await doctorsAPI.create(newDoctor)
      resetWizard()
      setIsAddingDoctor(false)
      fetchDoctors()
    } catch (error) {
      console.error('Failed to add doctor:', error)
    }
  }



  const updateDoctor = async () => {
    if (!editingDoctor) return

    try {
      await doctorsAPI.update(editingDoctor.id, editingDoctor)
      setEditingDoctor(null)
      fetchDoctors()
    } catch (error) {
      console.error('Failed to update doctor:', error)
    }
  }

  const updateDoctorStatus = async (doctorId: string, status: Doctor['status']) => {
    try {
      console.log('Updating doctor status:', doctorId, 'to', status)
      const result = await doctorsAPI.updateStatus(doctorId, status)
      console.log('Status update result:', result)
      fetchDoctors()
    } catch (error) {
      console.error('Failed to update doctor status:', error)
      alert(`Failed to update doctor status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) return
    
    try {
      console.log('Attempting to delete doctor:', doctorId)
      const result = await doctorsAPI.delete(doctorId)
      console.log('Delete result:', result)
      alert('Doctor deleted successfully!')
      fetchDoctors()
    } catch (error) {
      console.error('Failed to delete doctor:', error)
      alert(`Failed to delete doctor: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Function to automatically set doctors offline when their schedule ends
  const autoUpdateDoctorStatus = async () => {
    const doctorsToUpdate: Doctor[] = []
    
    for (const doctor of doctors) {
      const isCurrentlyAvailable = isDoctorCurrentlyAvailable(doctor)
      
      // If doctor is not currently available but their status is available or busy, set them offline
      if (!isCurrentlyAvailable && (doctor.status === 'available' || doctor.status === 'busy')) {
        doctorsToUpdate.push(doctor)
      }
    }
    
    // Update all doctors who should be offline
    for (const doctor of doctorsToUpdate) {
      try {
        await doctorsAPI.updateStatus(doctor.id, 'offline')
        console.log(`Auto-updated ${doctor.name} to offline (schedule ended)`)
      } catch (error) {
        console.error(`Failed to auto-update ${doctor.name} status:`, error)
      }
    }
    
    // Refresh the doctors list if any updates were made
    if (doctorsToUpdate.length > 0) {
      fetchDoctors()
    }
  }

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = doctor.name.toLowerCase().includes(query)
      const matchesSpecialization = doctor.specialization.toLowerCase().includes(query)
      const matchesLocation = doctor.location.toLowerCase().includes(query)
      const matchesPhone = doctor.phone.toLowerCase().includes(query)
      const matchesEmail = doctor.email.toLowerCase().includes(query)
      if (!matchesName && !matchesSpecialization && !matchesLocation && !matchesPhone && !matchesEmail) return false
    }
    
    if (specializationFilter && doctor.specialization !== specializationFilter) return false
    if (statusFilter && getEffectiveDoctorStatus(doctor) !== statusFilter) return false
    if (genderFilter && doctor.gender !== genderFilter) return false
    if (locationFilter && doctor.location !== locationFilter) return false
    if (experienceFilter) {
      const experience = doctor.experience || 0
      switch (experienceFilter) {
        case '0-2':
          if (experience > 2) return false
          break
        case '3-5':
          if (experience < 3 || experience > 5) return false
          break
        case '6-10':
          if (experience < 6 || experience > 10) return false
          break
        case '11+':
          if (experience < 11) return false
          break
      }
    }
    return true
  })

  // Get unique values for filters
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization))].filter(Boolean)
  const locations = [...new Set(doctors.map(doctor => doctor.location))].filter(Boolean)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
            <p className="text-gray-600">Manage doctor profiles and availability</p>
          </div>
          
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            onClick={() => setIsAddingDoctor(true)}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Doctor
          </button>
        </div>

        {/* Add Doctor Dialog */}
        <Dialog open={isAddingDoctor} onOpenChange={(open) => {
          if (!open) {
            handleCloseWizard()
          } else {
            setIsAddingDoctor(true)
          }
        }}>
          <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add New Doctor - Step {currentStep} of {totalSteps}</DialogTitle>
                    <p className="text-sm text-gray-600">
                      {currentStep === 1 && "Let's start with basic information about the doctor"}
                      {currentStep === 2 && "Now add contact details and professional information"}
                      {currentStep === 3 && "Set up the doctor's schedule and availability"}
                      {currentStep === 4 && "Review all information before adding the doctor"}
                    </p>
                  </DialogHeader>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    ></div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex justify-between mb-8">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step <= currentStep 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {step}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {step === 1 && "Basic Info"}
                          {step === 2 && "Contact & Professional"}
                          {step === 3 && "Schedule"}
                          {step === 4 && "Review"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Step Content */}
                  <div className="min-h-[400px]">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                          <p className="text-sm text-gray-600">Let's start with the doctor's essential details</p>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                          <div>
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">Full Name *</Label>
                            <input
                              id="name"
                              value={newDoctor.name}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Dr. John Smith"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 mb-2 block">Specialization *</Label>
                            <select 
                              value={newDoctor.specialization} 
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, specialization: e.target.value }))}
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              <option value="">Select specialization</option>
                              <option value="General Medicine">General Medicine</option>
                              <option value="Cardiology">Cardiology</option>
                              <option value="Dermatology">Dermatology</option>
                              <option value="Pediatrics">Pediatrics</option>
                              <option value="Orthopedics">Orthopedics</option>
                              <option value="Neurology">Neurology</option>
                              <option value="Psychiatry">Psychiatry</option>
                              <option value="Gynecology">Gynecology</option>
                              <option value="ENT">ENT</option>
                              <option value="Ophthalmology">Ophthalmology</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-2 block">Gender</Label>
                            <select 
                              value={newDoctor.gender} 
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="experience" className="text-sm font-medium text-gray-700 mb-2 block">Years of Experience</Label>
                            <input
                              id="experience"
                              type="number"
                              min="0"
                              max="50"
                              value={newDoctor.experience || ''}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, experience: e.target.value ? parseInt(e.target.value) : undefined }))}
                              placeholder="5"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Contact & Professional Details */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="p-4 bg-green-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Phone className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Contact & Professional Details</h3>
                          <p className="text-sm text-gray-600">Add contact information and professional credentials</p>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                          <div>
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">Phone Number *</Label>
                            <input
                              id="phone"
                              type="tel"
                              value={newDoctor.phone}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+1 (555) 123-4567"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">Email Address *</Label>
                            <input
                              id="email"
                              type="email"
                              value={newDoctor.email}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="doctor@clinic.com"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-2 block">Office Location *</Label>
                            <input
                              id="location"
                              value={newDoctor.location}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Room 101, Building A"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700 mb-2 block">Medical License Number</Label>
                            <input
                              id="licenseNumber"
                              value={newDoctor.licenseNumber}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, licenseNumber: e.target.value }))}
                              placeholder="MD123456789"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="consultationFee" className="text-sm font-medium text-gray-700 mb-2 block">Consultation Fee ($)</Label>
                            <input
                              id="consultationFee"
                              type="number"
                              min="0"
                              step="0.01"
                              value={newDoctor.consultationFee || ''}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, consultationFee: e.target.value ? parseFloat(e.target.value) : undefined }))}
                              placeholder="150.00"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="consultationDuration" className="text-sm font-medium text-gray-700 mb-2 block">Consultation Duration (minutes)</Label>
                            <input
                              id="consultationDuration"
                              type="number"
                              min="5"
                              max="120"
                              step="5"
                              value={newDoctor.consultationDuration}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, consultationDuration: parseInt(e.target.value) || 30 }))}
                              placeholder="30"
                              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex flex-wrap gap-1 mt-2">
                              {[15, 20, 30, 45, 60].map((duration) => (
                                <button
                                  key={duration}
                                  type="button"
                                  onClick={() => setNewDoctor(prev => ({ ...prev, consultationDuration: duration }))}
                                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                    newDoctor.consultationDuration === duration
                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {duration}min
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-2 block">Professional Bio</Label>
                            <textarea
                              id="bio"
                              rows={3}
                              value={newDoctor.bio}
                              onChange={(e) => setNewDoctor(prev => ({ ...prev, bio: e.target.value }))}
                              placeholder="Brief description of qualifications, expertise, and background..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Schedule & Availability */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="p-4 bg-orange-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-orange-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Schedule & Availability</h3>
                          <p className="text-sm text-gray-600">Set up working days and available time slots</p>
                        </div>

                        <div className="max-w-2xl mx-auto space-y-6">
                          {/* Working Days */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">Working Days *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                <label key={day} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newDoctor.workingDays.includes(day)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewDoctor(prev => ({ ...prev, workingDays: [...prev.workingDays, day] }))
                                      } else {
                                        setNewDoctor(prev => ({ ...prev, workingDays: prev.workingDays.filter(d => d !== day) }))
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{day.slice(0, 3)}</span>
                                </label>
                              ))}
                            </div>
                            
                            {/* Quick Schedule Templates */}
                            <div className="mt-4">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Quick Templates</Label>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewDoctor(prev => ({
                                      ...prev,
                                      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                  Weekdays
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewDoctor(prev => ({
                                      ...prev,
                                      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                >
                                  Mon-Sat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewDoctor(prev => ({
                                      ...prev,
                                      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                                >
                                  All Days
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Available Time Slots */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">Available Time Slots *</Label>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                              {[
                                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                                '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                                '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                                '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
                              ].map((time) => (
                                <label key={time} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newDoctor.availability.includes(time)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewDoctor(prev => ({ ...prev, availability: [...prev.availability, time].sort() }))
                                      } else {
                                        setNewDoctor(prev => ({ ...prev, availability: prev.availability.filter(t => t !== time) }))
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-700">{time}</span>
                                </label>
                              ))}
                            </div>
                            
                            {/* Time Templates */}
                            <div className="mt-4">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Time Templates</Label>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewDoctor(prev => ({
                                      ...prev,
                                      availability: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                  Standard (9AM-12PM, 2PM-5PM)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewDoctor(prev => ({
                                      ...prev,
                                      availability: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                >
                                  Morning (8AM-12PM)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewDoctor(prev => ({
                                      ...prev,
                                      availability: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00']
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                                >
                                  Evening (2PM-6PM)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Review & Confirm */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <div className="p-4 bg-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Award className="w-8 h-8 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
                          <p className="text-sm text-gray-600">Please review all information before adding the doctor</p>
                        </div>

                        <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information Review */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{newDoctor.name || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Specialization:</span> <span className="font-medium">{newDoctor.specialization || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Gender:</span> <span className="font-medium capitalize">{newDoctor.gender}</span></div>
                                {newDoctor.experience && <div><span className="text-gray-500">Experience:</span> <span className="font-medium">{newDoctor.experience} years</span></div>}
                              </div>
                            </div>

                            {/* Contact Information Review */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{newDoctor.phone || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{newDoctor.email || 'Not provided'}</span></div>
                                <div><span className="text-gray-500">Location:</span> <span className="font-medium">{newDoctor.location || 'Not provided'}</span></div>
                                {newDoctor.licenseNumber && <div><span className="text-gray-500">License:</span> <span className="font-medium">{newDoctor.licenseNumber}</span></div>}
                              </div>
                            </div>

                            {/* Professional Details Review */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Professional Details</h4>
                              <div className="space-y-2 text-sm">
                                {newDoctor.consultationFee && <div><span className="text-gray-500">Consultation Fee:</span> <span className="font-medium">${newDoctor.consultationFee}</span></div>}
                                <div><span className="text-gray-500">Consultation Duration:</span> <span className="font-medium">{newDoctor.consultationDuration} minutes</span></div>
                                {newDoctor.bio && <div><span className="text-gray-500">Bio:</span> <span className="font-medium">{newDoctor.bio.substring(0, 100)}{newDoctor.bio.length > 100 ? '...' : ''}</span></div>}
                              </div>
                            </div>

                            {/* Schedule Review */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Schedule</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Working Days:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {newDoctor.workingDays.length > 0 ? newDoctor.workingDays.map((day) => (
                                      <span key={day} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {day.slice(0, 3)}
                                      </span>
                                    )) : <span className="text-gray-400">None selected</span>}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Available Times:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {newDoctor.availability.length > 0 ? (() => {
                                      const timeRanges = createTimeRanges(newDoctor.availability, newDoctor.consultationDuration)
                                      return timeRanges.slice(0, 3).map((range, index) => (
                                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                          {range}
                                        </span>
                                      ))
                                    })() : <span className="text-gray-400">None selected</span>}
                                    {newDoctor.availability.length > 6 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        +{Math.ceil(newDoctor.availability.length / 2) - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <div>
                      {currentStep > 1 && (
                        <button 
                          type="button"
                          onClick={handlePrevStep}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <button 
                        type="button"
                        onClick={handleCloseWizard}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      
                      {currentStep < totalSteps ? (
                        <button 
                          type="button"
                          onClick={handleNextStep}
                          disabled={!canProceedToNextStep()}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          Next
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <button 
                          onClick={addDoctor} 
                          disabled={!canProceedToNextStep()}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          <Award className="w-4 h-4" />
                          Add Doctor
                        </button>
                      )}
                    </div>
                  </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Now</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctors.filter(d => d.status === 'available').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctors.filter(d => d.status === 'busy').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doctors.filter(d => d.status === 'offline').length}
                </p>
              </div>
            </div>
          </div>
        </div>





        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-3">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors..."
                  className="w-full h-8 pl-7 pr-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="w-44 h-8 px-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-28 h-8 px-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-28 h-8 px-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-32 h-8 px-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Experience</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="11+">11+ years</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-32 h-8 px-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setSpecializationFilter('')
                  setStatusFilter('')
                  setGenderFilter('')
                  setExperienceFilter('')
                  setLocationFilter('')
                }}
                className="w-16 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Doctors</h2>
            <p className="text-gray-600 mt-1">Manage all doctor profiles</p>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} id={`doctor-${doctor.id}`} className="bg-gray-50 rounded-lg p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  {/* Doctor Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        {doctor.experience && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Award className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{doctor.experience} years exp.</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingDoctor(doctor)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDoctor(doctor.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status and Fee */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs text-gray-500 font-medium mb-1 block">STATUS</span>
                      <select
                        value={doctor.status}
                        onChange={(e) => updateDoctorStatus(doctor.id, e.target.value as Doctor['status'])}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${
                          doctor.status === 'available' ? 'bg-green-100 text-green-800' :
                          doctor.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                    {doctor.consultationFee && (
                      <div className="text-right">
                        <span className="text-xs text-gray-500 font-medium mb-1 block">FEE</span>
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">{doctor.consultationFee}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* License Number */}
                  {doctor.licenseNumber && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 font-medium mb-1 block">LICENSE</span>
                      <span className="text-sm text-gray-700 font-mono">{doctor.licenseNumber}</span>
                    </div>
                  )}

                  {/* Working Days */}
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 font-medium mb-2 block">WORKING DAYS</span>
                    <div className="flex flex-wrap gap-1">
                      {doctor.workingDays?.length > 0 ? doctor.workingDays.map((day) => (
                        <span key={day} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {day.slice(0, 3)}
                        </span>
                      )) : (
                        <span className="text-xs text-gray-400">Not set</span>
                      )}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-medium mb-2 block">AVAILABILITY</span>
                    <div className="flex flex-wrap gap-1">
                      {doctor.availability?.length > 0 ? (() => {
                        const timeRanges = createTimeRanges(doctor.availability, doctor.consultationDuration || 30)
                        return (
                          <>
                            {timeRanges.slice(0, 3).map((range, index) => (
                              <span key={index} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                {range}
                              </span>
                            ))}
                            {timeRanges.length > 3 && (
                              <button 
                                onClick={() => {
                                  // Toggle showing all availability
                                  const card = document.getElementById(`doctor-${doctor.id}`);
                                  const allSlots = card?.querySelector('.all-availability');
                                  if (allSlots) {
                                    allSlots.classList.toggle('hidden');
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                              >
                                +{timeRanges.length - 3} more
                              </button>
                            )}
                            {timeRanges.length > 3 && (
                              <div className="all-availability hidden w-full mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {timeRanges.slice(3).map((range, index) => (
                                    <span key={index + 3} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                      {range}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })() : (
                        <span className="text-xs text-gray-400">Not set</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{doctor.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{doctor.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600 truncate">{doctor.email}</span>
                    </div>
                  </div>

                  {/* Bio Preview */}
                  {doctor.bio && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-medium mb-1 block">BIO</span>
                      <p className="text-xs text-gray-600 line-clamp-2">{doctor.bio}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No doctors found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or add a new doctor</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Doctor Dialog */}
        {editingDoctor && (
          <Dialog open={!!editingDoctor} onOpenChange={() => setEditingDoctor(null)}>
            <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Edit Doctor Profile</DialogTitle>
                <p className="text-sm text-gray-600">Update doctor information and schedule</p>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                  
                  <div>
                    <Label htmlFor="editName" className="text-sm font-medium text-gray-700 mb-2 block">Full Name *</Label>
                    <input
                      id="editName"
                      value={editingDoctor.name}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      placeholder="Dr. John Smith"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editSpecialization" className="text-sm font-medium text-gray-700 mb-2 block">Specialization *</Label>
                    <select 
                      value={editingDoctor.specialization} 
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, specialization: e.target.value }) : null)}
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="ENT">ENT</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="editGender" className="text-sm font-medium text-gray-700 mb-2 block">Gender</Label>
                    <select 
                      value={editingDoctor.gender} 
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }) : null)}
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="editExperience" className="text-sm font-medium text-gray-700 mb-2 block">Years of Experience</Label>
                    <input
                      id="editExperience"
                      type="number"
                      min="0"
                      max="50"
                      value={editingDoctor.experience || ''}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, experience: e.target.value ? parseInt(e.target.value) : undefined }) : null)}
                      placeholder="5"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editLicenseNumber" className="text-sm font-medium text-gray-700 mb-2 block">Medical License Number</Label>
                    <input
                      id="editLicenseNumber"
                      value={editingDoctor.licenseNumber || ''}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, licenseNumber: e.target.value }) : null)}
                      placeholder="MD123456789"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editConsultationFee" className="text-sm font-medium text-gray-700 mb-2 block">Consultation Fee ($)</Label>
                    <input
                      id="editConsultationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDoctor.consultationFee || ''}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, consultationFee: e.target.value ? parseFloat(e.target.value) : undefined }) : null)}
                      placeholder="150.00"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editConsultationDuration" className="text-sm font-medium text-gray-700 mb-2 block">Consultation Duration (minutes)</Label>
                    <input
                      id="editConsultationDuration"
                      type="number"
                      min="5"
                      max="120"
                      step="5"
                      value={editingDoctor.consultationDuration || 30}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, consultationDuration: parseInt(e.target.value) || 30 }) : null)}
                      placeholder="30"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Consultation duration in minutes (5-120 min, required)</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[15, 20, 30, 45, 60].map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => setEditingDoctor(prev => prev ? ({ ...prev, consultationDuration: duration }) : null)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            (editingDoctor.consultationDuration || 30) === duration
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {duration}min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contact & Location</h3>
                  
                  <div>
                    <Label htmlFor="editLocation" className="text-sm font-medium text-gray-700 mb-2 block">Office Location *</Label>
                    <input
                      id="editLocation"
                      value={editingDoctor.location}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, location: e.target.value }) : null)}
                      placeholder="Room 101, Building A"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editPhone" className="text-sm font-medium text-gray-700 mb-2 block">Phone Number *</Label>
                    <input
                      id="editPhone"
                      type="tel"
                      value={editingDoctor.phone}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editEmail" className="text-sm font-medium text-gray-700 mb-2 block">Email Address *</Label>
                    <input
                      id="editEmail"
                      type="email"
                      value={editingDoctor.email}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                      placeholder="doctor@clinic.com"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editBio" className="text-sm font-medium text-gray-700 mb-2 block">Professional Bio</Label>
                    <textarea
                      id="editBio"
                      rows={4}
                      value={editingDoctor.bio || ''}
                      onChange={(e) => setEditingDoctor(prev => prev ? ({ ...prev, bio: e.target.value }) : null)}
                      placeholder="Brief description of qualifications, expertise, and background..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule & Availability Section */}
              <div className="mt-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Schedule & Availability</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Working Days */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Working Days</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label key={day} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingDoctor.workingDays?.includes(day) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingDoctor(prev => prev ? ({ ...prev, workingDays: [...(prev.workingDays || []), day] }) : null)
                              } else {
                                setEditingDoctor(prev => prev ? ({ ...prev, workingDays: (prev.workingDays || []).filter(d => d !== day) }) : null)
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Available Time Slots</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {[
                        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
                      ].map((time) => (
                        <label key={time} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingDoctor.availability?.includes(time) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingDoctor(prev => prev ? ({ ...prev, availability: [...(prev.availability || []), time].sort() }) : null)
                              } else {
                                setEditingDoctor(prev => prev ? ({ ...prev, availability: (prev.availability || []).filter(t => t !== time) }) : null)
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{time}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Select all time slots when this doctor is available for appointments</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={updateDoctor} 
                  disabled={!editingDoctor.name || !editingDoctor.specialization || !editingDoctor.phone || !editingDoctor.email}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Update Doctor
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}

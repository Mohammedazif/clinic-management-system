"use client"

import { useState, useEffect } from 'react'
import { Plus, Clock, UserCheck, AlertCircle, Phone, User, Calendar, Stethoscope } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'
import { queueAPI, doctorsAPI, appointmentsAPI } from '@/lib/api'

interface QueueItem {
  id: string
  queueNumber: number
  patientName: string
  patientPhone: string
  patientAge?: number
  status: 'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  reason?: string
  notes?: string
  estimatedWaitTime?: number
  calledAt?: string
  consultationStartedAt?: string
  consultationEndedAt?: string
  createdAt: string
  updatedAt: string
  doctor?: {
    id: string
    name: string
    specialization: string
  }
  doctorId?: string
  waitingTime?: number
  consultationDuration?: number
  isActive?: boolean
}

interface Doctor {
  id: string
  name: string
  specialization: string
  status: 'available' | 'busy' | 'offline'
  location: string
  consultationFee: number
  isActive: boolean
  workingDays: string[]
  availability: string[]
  consultationDuration: number
}

export default function QueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [stats, setStats] = useState({ 
    waiting: 0, 
    inConsultation: 0, 
    completed: 0,
    completedToday: 0,
    scheduledAppointments: 0,
    cancelledAppointments: 0
  })
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([])
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [newPatient, setNewPatient] = useState({
    patientName: '',
    patientPhone: '',
    patientAge: '',
    priority: 'normal' as QueueItem['priority'],
    reason: ''
  })

  useEffect(() => {
    fetchQueue()
    fetchDoctors()
    fetchStats()
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchQueue()
      fetchDoctors()
      fetchStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchQueue = async () => {
    try {
      setLoading(true)
      const data = await queueAPI.getAll({ activeOnly: true })
      setQueueItems(data)
    } catch (error) {
      console.error('Failed to fetch queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const data = await doctorsAPI.getAll()
      setDoctors(data)
      // Filter available and busy doctors for assignment (exclude offline only)
      const assignable = data.filter((doc: Doctor) => 
        ['available', 'busy'].includes(doc.status) && doc.isActive
      )
      setAvailableDoctors(assignable)
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    }
  }

  // Check if doctor is currently available based on schedule
  const isDoctorCurrentlyAvailable = (doctor: Doctor) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Check if doctor works today
    if (!doctor.workingDays?.includes(currentDay)) return false
    
    // Check if doctor has availability set
    if (!doctor.availability || doctor.availability.length === 0) return false
    
    // Get the start and end of working hours
    const sortedSlots = [...doctor.availability].sort()
    const workStartTime = sortedSlots[0]
    const workEndTime = sortedSlots[sortedSlots.length - 1]
    
    // Add consultation duration to the last slot to get actual end time
    const actualEndTime = addMinutes(workEndTime, doctor.consultationDuration || 30)
    
    // Check if current time is within working hours
    return currentTime >= workStartTime && currentTime <= actualEndTime
  }

  // Helper function to add minutes to time string
  const addMinutes = (timeStr: string, minutes: number) => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }

  // Helper function to format time to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`
  }

  // Helper function to calculate time difference in minutes
  const getTimeDifferenceInMinutes = (time1: string, time2: string) => {
    const [hours1, minutes1] = time1.split(':').map(Number)
    const [hours2, minutes2] = time2.split(':').map(Number)
    const totalMinutes1 = hours1 * 60 + minutes1
    const totalMinutes2 = hours2 * 60 + minutes2
    return totalMinutes2 - totalMinutes1
  }

  // Function to create time ranges from selected slots (same as doctor page)
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

  // Smart doctor selection - finds doctor with least workload and schedule awareness
  const getOptimalDoctor = () => {
    if (availableDoctors.length === 0) return null
    
    // Filter doctors who are currently available based on schedule
    const scheduleAwareDoctors = availableDoctors.filter(doctor => {
      // Must be active and have status available/busy
      if (!doctor.isActive || doctor.status === 'offline') return false
      
      // Check schedule availability
      return isDoctorCurrentlyAvailable(doctor)
    })
    
    if (scheduleAwareDoctors.length === 0) return null
    
    // Count current patients assigned to each schedule-available doctor
    const doctorWorkload = scheduleAwareDoctors.map(doctor => {
      const assignedPatients = queueItems.filter(patient => 
        patient.doctor?.id === doctor.id && 
        ['waiting', 'called', 'in_consultation'].includes(patient.status)
      ).length
      
      return {
        doctor,
        workload: assignedPatients,
        isCompleteFree: assignedPatients === 0,
        isAvailable: doctor.status === 'available',
        isBusy: doctor.status === 'busy',
        isScheduleAvailable: isDoctorCurrentlyAvailable(doctor)
      }
    })
    
    // Sort by priority: Schedule Available > Status Available > Busy, then by workload
    doctorWorkload.sort((a, b) => {
      // First priority: Schedule availability
      if (a.isScheduleAvailable && !b.isScheduleAvailable) return -1
      if (!a.isScheduleAvailable && b.isScheduleAvailable) return 1
      
      // Second priority: Available doctors over busy doctors
      if (a.isAvailable && b.isBusy) return -1
      if (a.isBusy && b.isAvailable) return 1
      
      // Third priority: Completely free doctors
      if (a.isCompleteFree && !b.isCompleteFree) return -1
      if (!a.isCompleteFree && b.isCompleteFree) return 1
      
      // Fourth priority: Least workload
      return a.workload - b.workload
    })
    
    return doctorWorkload[0]?.doctor || null
  }

  const fetchStats = async () => {
    try {
      // Fetch comprehensive data like dashboard
      const [statsData, appointmentsData] = await Promise.all([
        queueAPI.getStats(),
        appointmentsAPI.getAll().catch(() => []) // Fallback to empty array if appointments API fails
      ])

      // Calculate enhanced stats like dashboard
      const today = new Date().toISOString().split('T')[0]
      const todayAppointments = appointmentsData.filter(apt => apt.date === today)
      const scheduledAppointments = todayAppointments.filter(apt => apt.status === 'scheduled').length
      const cancelledAppointments = todayAppointments.filter(apt => apt.status === 'cancelled').length
      const completedAppointments = todayAppointments.filter(apt => apt.status === 'completed').length

      // Enhanced stats with same structure as dashboard
      const enhancedStats = {
        ...statsData,
        completedToday: completedAppointments + (statsData.completed || 0), // Combine appointment + queue completions
        scheduledAppointments,
        cancelledAppointments
      }
      
      setStats(enhancedStats)
    } catch (error) {
      console.error('Failed to fetch queue stats:', error)
      // Set default values on error
      setStats({
        waiting: 0,
        inConsultation: 0,
        completed: 0,
        completedToday: 0,
        scheduledAppointments: 0,
        cancelledAppointments: 0
      })
    }
  }

  // Utility function to calculate waiting time
  const calculateWaitingTime = (createdAt: string, calledAt?: string) => {
    const start = new Date(createdAt)
    const end = calledAt ? new Date(calledAt) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return Math.max(0, diffMins)
  }

  // Utility function to format time duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Auto-escalate priority based on wait time
  const getEffectivePriority = (originalPriority: QueueItem['priority'], waitTimeMinutes: number) => {
    // Priority escalation thresholds - starts at 30 minutes
    if (waitTimeMinutes >= 90) return 'urgent'  // 1.5+ hours = urgent
    if (waitTimeMinutes >= 60) return 'high'    // 1+ hour = high
    if (waitTimeMinutes >= 30) return 'normal'  // 30+ mins = normal (minimum)
    return originalPriority // Keep original if under 30 mins
  }

  // Check if priority was auto-escalated
  const isPriorityEscalated = (originalPriority: QueueItem['priority'], effectivePriority: QueueItem['priority']) => {
    const priorityLevels = { low: 0, normal: 1, high: 2, urgent: 3 }
    return priorityLevels[effectivePriority] > priorityLevels[originalPriority]
  }

  const addPatient = async () => {
    if (!newPatient.patientName || !newPatient.patientPhone) {
      alert('Please fill in required fields')
      return
    }

    try {
      setLoading(true)
      const patientData = {
        ...newPatient,
        patientAge: newPatient.patientAge ? parseInt(newPatient.patientAge) : undefined
      }
      await queueAPI.create(patientData)
      setNewPatient({ patientName: '', patientPhone: '', patientAge: '', priority: 'normal', reason: '' })
      setIsAddingPatient(false)
      fetchQueue()
      fetchStats()
      alert('Patient added to queue successfully!')
    } catch (error) {
      console.error('Failed to add patient:', error)
      alert('Failed to add patient to queue')
    } finally {
      setLoading(false)
    }
  }

  const updatePatientStatus = async (patientId: string, status: QueueItem['status']) => {
    try {
      setLoading(true)
      await queueAPI.updateStatus(patientId, status)
      fetchQueue()
      fetchStats()
    } catch (error) {
      console.error('Failed to update patient status:', error)
      alert('Failed to update patient status')
    } finally {
      setLoading(false)
    }
  }

  // Smart call next for specific doctor
  const callNextForDoctor = async (doctorId: string) => {
    try {
      setLoading(true)
      // Find waiting patients assigned to this specific doctor
      const doctorPatients = queueItems.filter(p => 
        p.status === 'waiting' && 
        p.doctor?.id === doctorId
      )
      
      if (doctorPatients.length === 0) {
        const doctor = availableDoctors.find(d => d.id === doctorId)
        alert(`No patients waiting for ${doctor?.name || 'this doctor'}`)
        return
      }

      // Sort by effective priority then by wait time
      const sortedPatients = doctorPatients.sort((a, b) => {
        const aWaitTime = calculateWaitingTime(a.createdAt)
        const bWaitTime = calculateWaitingTime(b.createdAt)
        const aEffectivePriority = getEffectivePriority(a.priority, aWaitTime)
        const bEffectivePriority = getEffectivePriority(b.priority, bWaitTime)
        
        const priorityLevels = { low: 0, normal: 1, high: 2, urgent: 3 }
        const priorityDiff = priorityLevels[bEffectivePriority] - priorityLevels[aEffectivePriority]
        
        if (priorityDiff === 0) {
          return bWaitTime - aWaitTime
        }
        return priorityDiff
      })

      const nextPatient = sortedPatients[0]
      const waitTime = calculateWaitingTime(nextPatient.createdAt)
      const effectivePriority = getEffectivePriority(nextPatient.priority, waitTime)
      const wasEscalated = isPriorityEscalated(nextPatient.priority, effectivePriority)
      
      await queueAPI.updateStatus(nextPatient.id, 'called')
      
      const escalationNote = wasEscalated ? ` (Priority escalated to ${effectivePriority.toUpperCase()} due to ${formatDuration(waitTime)} wait)` : ''
      alert(`Called patient: ${nextPatient.patientName} (Queue #${nextPatient.queueNumber}) → ${nextPatient.doctor?.name}${escalationNote}`)
      
      fetchQueue()
      fetchStats()
    } catch (error) {
      console.error('Failed to call next patient:', error)
      alert('Failed to call next patient')
    } finally {
      setLoading(false)
    }
  }

  // General call next (highest priority across all doctors)
  const callNext = async () => {
    try {
      setLoading(true)
      // Find waiting patients who have doctors assigned
      const waitingPatients = queueItems.filter(p => p.status === 'waiting' && p.doctor)
      if (waitingPatients.length === 0) {
        const unassignedCount = queueItems.filter(p => p.status === 'waiting' && !p.doctor).length
        if (unassignedCount > 0) {
          alert(`Cannot call next patient. ${unassignedCount} patient(s) waiting but no doctors assigned. Please assign doctors first.`)
        } else {
          alert('No patients waiting in queue')
        }
        return
      }

      // Sort by effective priority (including auto-escalation) then by wait time
      const sortedPatients = waitingPatients.sort((a, b) => {
        const aWaitTime = calculateWaitingTime(a.createdAt)
        const bWaitTime = calculateWaitingTime(b.createdAt)
        const aEffectivePriority = getEffectivePriority(a.priority, aWaitTime)
        const bEffectivePriority = getEffectivePriority(b.priority, bWaitTime)
        
        const priorityLevels = { low: 0, normal: 1, high: 2, urgent: 3 }
        const priorityDiff = priorityLevels[bEffectivePriority] - priorityLevels[aEffectivePriority]
        
        // If same priority, call the one who waited longer
        if (priorityDiff === 0) {
          return bWaitTime - aWaitTime
        }
        return priorityDiff
      })

      const nextPatient = sortedPatients[0]
      const waitTime = calculateWaitingTime(nextPatient.createdAt)
      const effectivePriority = getEffectivePriority(nextPatient.priority, waitTime)
      const wasEscalated = isPriorityEscalated(nextPatient.priority, effectivePriority)
      
      await queueAPI.updateStatus(nextPatient.id, 'called')
      
      // Show informative alert about the called patient
      const escalationNote = wasEscalated ? ` (Priority escalated to ${effectivePriority.toUpperCase()} due to ${formatDuration(waitTime)} wait)` : ''
      const doctorNote = nextPatient.doctor ? ` → ${nextPatient.doctor.name}` : ''
      alert(`Called patient: ${nextPatient.patientName} (Queue #${nextPatient.queueNumber})${escalationNote}${doctorNote}`)
      
      fetchQueue()
      fetchStats()
    } catch (error) {
      console.error('Failed to call next patient:', error)
      alert('Failed to call next patient')
    } finally {
      setLoading(false)
    }
  }

  const assignDoctor = async (patientId: string, doctorId: string) => {
    try {
      setLoading(true)
      await queueAPI.assignDoctor(patientId, doctorId)
      fetchQueue()
    } catch (error) {
      console.error('Failed to assign doctor:', error)
      alert('Failed to assign doctor')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: QueueItem['status']) => {
    const statusConfig = {
      waiting: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Waiting' },
      called: { color: 'bg-blue-100 text-blue-700', icon: UserCheck, label: 'Called' },
      in_consultation: { color: 'bg-green-100 text-green-700', icon: Stethoscope, label: 'In Consultation' },
      completed: { color: 'bg-gray-100 text-gray-700', icon: UserCheck, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Cancelled' },
      no_show: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'No Show' }
    }
    
    const config = statusConfig[status] || statusConfig.waiting
    const Icon = config.icon
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (patient: QueueItem) => {
    const waitTime = calculateWaitingTime(patient.createdAt, patient.calledAt)
    const originalPriority = patient.priority
    const effectivePriority = getEffectivePriority(originalPriority, waitTime)
    const wasEscalated = isPriorityEscalated(originalPriority, effectivePriority)
    
    const priorityConfig: Record<string, { color: string; label: string; icon?: any }> = {
      low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
      normal: { color: 'bg-blue-100 text-blue-700', label: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
      urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent', icon: AlertCircle }
    }
    
    const config = priorityConfig[effectivePriority] || priorityConfig.normal
    const Icon = config.icon
    
    return (
      <div className="flex flex-col items-start">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} ${wasEscalated ? 'ring-2 ring-red-300' : ''}`}>
          {Icon && <Icon className="w-3 h-3 mr-1 inline" />}
          {config.label}
          {wasEscalated && <span className="ml-1">⬆️</span>}
        </span>
        {wasEscalated && (
          <span className="text-xs text-red-600 mt-1">
            Auto-escalated ({formatDuration(waitTime)})
          </span>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-gray-600">Manage walk-in patients and queue status</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => callNext()}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 mr-2 inline" />
              Call Next
            </button>
            
            <button
              onClick={() => setIsAddingPatient(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Patient
            </button>
          </div>
        </div>

        {/* Enhanced Queue Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total in Queue</p>
                <p className="text-2xl font-bold text-gray-900">{queueItems.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-gray-900">{stats.waiting}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Consultation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inConsultation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Working Doctors Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Working Doctors</h2>
            <p className="text-gray-600 text-sm mt-1">Schedule-aware doctor availability and patient assignments</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableDoctors.map((doctor) => {
                const assignedPatients = queueItems.filter(p => 
                  p.doctor?.id === doctor.id && 
                  ['waiting', 'called', 'in_consultation'].includes(p.status)
                )
                const waitingCount = assignedPatients.filter(p => p.status === 'waiting').length
                const inConsultationCount = assignedPatients.filter(p => p.status === 'in_consultation').length
                const isScheduleAvailable = isDoctorCurrentlyAvailable(doctor)
                const currentTime = new Date().toTimeString().slice(0, 5)
                
                return (
                  <div key={doctor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isScheduleAvailable && doctor.status === 'available' ? 'bg-green-500' : 
                          isScheduleAvailable && doctor.status === 'busy' ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}></div>
                        <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                        {isScheduleAvailable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                            On Schedule
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {doctor.specialization}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Schedule Status:</span>
                        <span className={`font-medium ${
                          isScheduleAvailable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isScheduleAvailable ? 'Available' : 'Off Schedule'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Time:</span>
                        <span className="font-medium text-gray-900">{currentTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Assigned:</span>
                        <span className="font-medium">{assignedPatients.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Waiting:</span>
                        <span className="font-medium text-yellow-600">{waitingCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">In Consultation:</span>
                        <span className="font-medium text-green-600">{inConsultationCount}</span>
                      </div>
                    </div>
                    
                    {/* Schedule Information */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">
                        <div className="flex flex-col">
                          <span className="font-medium mb-1">Today's Schedule:</span>
                          {doctor.availability && doctor.availability.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {createTimeRanges(doctor.availability, doctor.consultationDuration || 30).map((range, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"
                                >
                                  {range}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-red-600 font-medium">No Schedule Set</span>
                          )}
                        </div>
                      </div>
                      
                      {assignedPatients.length > 0 && (
                        <button
                          onClick={() => callNextForDoctor(doctor.id)}
                          disabled={loading || waitingCount === 0 || !isScheduleAvailable}
                          className={`w-full px-3 py-2 text-xs font-medium rounded transition-colors ${
                            isScheduleAvailable 
                              ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100' 
                              : 'text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isScheduleAvailable ? `Call Next for Dr. ${doctor.name}` : 'Doctor Off Schedule'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {availableDoctors.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No doctors available for assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Add Patient Dialog */}
        {isAddingPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Walk-in Patient</h2>
                <button
                  onClick={() => setIsAddingPatient(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                  <input
                    type="text"
                    value={newPatient.patientName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="Enter patient name"
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={newPatient.patientPhone}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, patientPhone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={newPatient.patientAge}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, patientAge: e.target.value }))}
                    placeholder="Enter age"
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newPatient.priority}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, priority: e.target.value as QueueItem['priority'] }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                  <textarea
                    value={newPatient.reason}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Brief description of the issue"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAddingPatient(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addPatient}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add to Queue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}





        {/* Queue Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Current Queue</h2>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${queueItems.length} patients in queue`}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wait Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No patients in queue</p>
                      <p className="text-sm">Add a walk-in patient to get started</p>
                    </td>
                  </tr>
                ) : (
                  queueItems.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{patient.queueNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{patient.patientName}</div>
                          {patient.patientAge && (
                            <div className="text-sm text-gray-500">Age: {patient.patientAge}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {patient.patientPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(patient)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(patient.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDuration(calculateWaitingTime(patient.createdAt, patient.calledAt))}
                        </div>
                        {patient.reason && (
                          <div className="text-xs text-gray-500 mt-1">{patient.reason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.doctor ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{patient.doctor.name}</div>
                            <div className="text-gray-500">{patient.doctor.specialization}</div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value === 'quick') {
                                  const optimalDoctor = getOptimalDoctor()
                                  if (optimalDoctor) assignDoctor(patient.id, optimalDoctor.id)
                                } else if (e.target.value) {
                                  assignDoctor(patient.id, e.target.value)
                                }
                                e.target.value = '' // Reset dropdown
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              defaultValue=""
                            >
                              <option value="">Select Doctor...</option>
                              {availableDoctors.length > 0 && (() => {
                                const optimalDoctor = getOptimalDoctor()
                                const workload = optimalDoctor ? queueItems.filter(p => 
                                  p.doctor?.id === optimalDoctor.id && 
                                  ['waiting', 'called', 'in_consultation'].includes(p.status)
                                ).length : 0
                                const workloadText = workload === 0 ? 'Free' : `${workload} patients`
                                const statusText = optimalDoctor?.status === 'available' ? 'Available' : 'Busy'
                                return (
                                  <option value="quick" className="font-medium text-green-700">
                                    ⚡ Quick Assign ({optimalDoctor?.name} - {statusText}, {workloadText})
                                  </option>
                                )
                              })()}
                              <option disabled>──────────</option>
                              {availableDoctors.map((doctor) => {
                                const doctorWorkload = queueItems.filter(p => 
                                  p.doctor?.id === doctor.id && 
                                  ['waiting', 'called', 'in_consultation'].includes(p.status)
                                ).length
                                const workloadText = doctorWorkload === 0 ? 'Free' : `${doctorWorkload} patients`
                                const statusText = doctor.status === 'available' ? 'Available' : 'Busy'
                                const statusIcon = doctor.status === 'available' ? '🟢' : '🟠'
                                return (
                                  <option key={doctor.id} value={doctor.id}>
                                    {statusIcon} {doctor.name} - {doctor.specialization} ({statusText}, {workloadText})
                                  </option>
                                )
                              })}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {patient.status === 'waiting' && (
                            <button
                              onClick={() => updatePatientStatus(patient.id, 'called')}
                              disabled={loading}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              Call
                            </button>
                          )}
                          {patient.status === 'called' && (
                            <button
                              onClick={() => updatePatientStatus(patient.id, 'in_consultation')}
                              disabled={loading}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              Start
                            </button>
                          )}
                          {patient.status === 'in_consultation' && (
                            <button
                              onClick={() => updatePatientStatus(patient.id, 'completed')}
                              disabled={loading}
                              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

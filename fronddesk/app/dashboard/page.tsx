"use client"

import { useState, useEffect } from 'react'
import { Users, Calendar, Clock, UserCheck, Activity, AlertTriangle, TrendingUp, Stethoscope, ArrowUp, ArrowDown, Minus, Eye, UserPlus, Phone, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'
import { queueAPI, doctorsAPI, appointmentsAPI } from '@/lib/api'
import Link from 'next/link'

interface DashboardStats {
  totalPatients: number
  todayAppointments: number
  queueLength: number
  completedToday: number
  averageWaitTime: number
  urgentPatients: number
  availableDoctors: number
  busyDoctors: number
  totalDoctors: number
  escalatedPatients: number
  scheduledAppointments: number
  cancelledAppointments: number
  revenue: number
  patientSatisfaction: number
}

interface Doctor {
  id: string
  name: string
  specialization: string
  status: 'available' | 'busy' | 'offline'
  location: string
  consultationFee: number
  isActive: boolean
  currentPatients?: number
  workingDays: string[]
  availability: string[]
  consultationDuration: number
}

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

interface RecentActivity {
  id: string
  type: 'patient_added' | 'patient_called' | 'patient_completed' | 'doctor_status' | 'priority_escalated'
  message: string
  timestamp: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    queueLength: 0,
    completedToday: 0,
    averageWaitTime: 0,
    urgentPatients: 0,
    availableDoctors: 0,
    busyDoctors: 0,
    totalDoctors: 0,
    escalatedPatients: 0,
    scheduledAppointments: 0,
    cancelledAppointments: 0,
    revenue: 0,
    patientSatisfaction: 0
  })
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update time on client-side only to prevent hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    
    // Set initial time
    updateTime()
    
    // Update time every second
    const timeInterval = setInterval(updateTime, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch comprehensive dashboard data
      const [statsData, doctorsData, queueData, appointmentsData] = await Promise.all([
        queueAPI.getStats(),
        doctorsAPI.getAll(),
        queueAPI.getAll(),
        appointmentsAPI.getAll().catch(() => []) // Fallback to empty array if appointments API fails
      ])

      // Calculate enhanced stats
      const today = new Date().toISOString().split('T')[0]
      const todayAppointments = appointmentsData.filter(apt => apt.date === today)
      const scheduledAppointments = todayAppointments.filter(apt => apt.status === 'scheduled').length
      const cancelledAppointments = todayAppointments.filter(apt => apt.status === 'cancelled').length
      
      // Calculate revenue from completed appointments
      const completedAppointments = todayAppointments.filter(apt => apt.status === 'completed')
      const revenue = completedAppointments.reduce((sum, apt) => {
        const doctor = doctorsData.find(d => d.id === apt.doctorId)
        return sum + (doctor?.consultationFee || 0)
      }, 0)

      // Calculate urgent and escalated patients from queue data
      const urgentPatients = queueData.filter(item => 
        ['waiting', 'called', 'in_consultation'].includes(item.status) && 
        item.priority === 'urgent'
      ).length
      
      const escalatedPatients = queueData.filter(item => {
        if (!['waiting', 'called', 'in_consultation'].includes(item.status)) return false
        
        // Calculate waiting time in minutes
        const createdAt = new Date(item.createdAt)
        const now = new Date()
        const waitingMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
        
        // Auto-escalation logic: escalate if waiting > 30 minutes and not already urgent
        const shouldEscalate = waitingMinutes > 30 && item.priority !== 'urgent'
        return shouldEscalate
      }).length

      // Enhanced stats with appointments data
      const enhancedStats = {
        ...statsData,
        scheduledAppointments,
        cancelledAppointments,
        completedToday: completedAppointments.length + (statsData.completed || 0), // Combine appointment + queue completions
        urgentPatients, // Override with calculated value
        escalatedPatients, // Override with calculated value
        revenue,
        patientSatisfaction: Math.floor(Math.random() * 20) + 80 // Mock satisfaction score 80-100%
      }
      
      setStats(enhancedStats)
      
      // Set queue items data
      setQueueItems(queueData)
      
      // Set doctors data and calculate current patients
      const doctorsWithPatients = doctorsData.map(doctor => ({
        ...doctor,
        currentPatients: queueData.filter(item => 
          ['waiting', 'called', 'in_consultation'].includes(item.status) && 
          item.doctor?.id === doctor.id
        ).length
      }))
      setDoctors(doctorsWithPatients)
      
      // Generate recent activity from queue and appointments data
      generateRecentActivity([...queueData, ...appointmentsData], doctorsWithPatients)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Set default values on error
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        queueLength: 0,
        completedToday: 0,
        averageWaitTime: 0,
        urgentPatients: 0,
        escalatedPatients: 0,
        availableDoctors: 0,
        busyDoctors: 0,
        totalDoctors: 0,
        scheduledAppointments: 0,
        cancelledAppointments: 0,
        revenue: 0,
        patientSatisfaction: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const generateRecentActivity = (combinedData: any[], doctorsData: Doctor[] = []) => {
    // Filter and process queue items
    const queueActivities = combinedData
      .filter(item => item.queueNumber !== undefined || item.patientName && !item.date)
      .map((item, index) => ({
        ...item,
        source: 'queue',
        sortTime: new Date(item.updatedAt || item.createdAt).getTime()
      }))
    
    // Filter and process appointment items  
    const appointmentActivities = combinedData
      .filter(item => item.date !== undefined && item.time !== undefined)
      .map((item, index) => ({
        ...item,
        source: 'appointment',
        sortTime: new Date(item.updatedAt || item.createdAt).getTime()
      }))
    
    // Combine and sort all activities
    const allActivities = [...queueActivities, ...appointmentActivities]
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 15) // Show more activities
    
    const activities: RecentActivity[] = allActivities.map((item, index) => {
      const isQueueItem = item.source === 'queue'
      const isAppointment = item.source === 'appointment'
      
      let type: RecentActivity['type'] = 'patient_added'
      let message = ''
      
      if (isQueueItem) {
        // Queue activities with clear indicators
        type = item.status === 'completed' ? 'patient_completed' : 
              item.status === 'called' ? 'patient_called' : 
              item.status === 'in_consultation' ? 'patient_called' : 'patient_added'
        
        const queueNum = item.queueNumber !== undefined ? item.queueNumber : 'undefined'
        
        message = item.status === 'completed' 
          ? `🏥 Queue: ${item.patientName} (#${queueNum}) completed consultation`
          : item.status === 'called'
          ? `📢 Queue: ${item.patientName} (#${queueNum}) called for consultation`
          : item.status === 'in_consultation'
          ? `👨‍⚕️ Queue: ${item.patientName} (#${queueNum}) started consultation`
          : `➕ Queue: ${item.patientName} (#${queueNum}) added to queue`
      } else if (isAppointment) {
        // Appointment activities with clear indicators
        type = item.status === 'completed' ? 'patient_completed' : 
              item.status === 'confirmed' ? 'patient_called' : 
              item.status === 'in_progress' ? 'patient_called' :
              item.status === 'cancelled' ? 'patient_completed' : 'patient_added'
        
        const appointmentDate = new Date(item.date).toLocaleDateString()
        const doctor = doctorsData.find(d => d.id === item.doctorId)
        const doctorName = doctor ? `Dr. ${doctor.name}` : (item.doctorName || 'Unknown Doctor')
        
        message = item.status === 'completed' 
          ? `✅ Appointment: ${item.patientName} completed with ${doctorName}`
          : item.status === 'confirmed'
          ? `📅 Appointment: ${item.patientName} confirmed for ${appointmentDate}`
          : item.status === 'in_progress'
          ? `🩺 Appointment: ${item.patientName} started with ${doctorName}`
          : item.status === 'cancelled'
          ? `❌ Appointment: ${item.patientName} cancelled for ${appointmentDate}`
          : `📝 Appointment: ${item.patientName} scheduled with ${doctorName} on ${appointmentDate}`
      }
      
      return {
        id: `activity-${item.source}-${item.id || index}`,
        type,
        message,
        timestamp: item.updatedAt || item.createdAt,
        priority: item.priority || 'normal'
      }
    })
    
    setRecentActivity(activities)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600">Real-time clinic operations and performance insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {currentTime}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              loading ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`}></div>
              {loading ? 'Updating...' : 'Live'}
            </div>
          </div>
        </div>

        {/* Key Metrics Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Queue Status */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.queueLength}</div>
                <p className="text-sm text-gray-600">In Queue</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Urgent:</span>
              <span className={`font-medium ${stats.urgentPatients > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {stats.urgentPatients}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Escalated:</span>
              <span className={`font-medium ${stats.escalatedPatients > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {stats.escalatedPatients}
              </span>
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.scheduledAppointments}</div>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">{stats.completedToday || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Cancelled:</span>
              <span className={`font-medium ${stats.cancelledAppointments > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {stats.cancelledAppointments}
              </span>
            </div>
          </div>

          {/* Doctor Availability */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Stethoscope className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.availableDoctors}</div>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Busy:</span>
              <span className="font-medium text-yellow-600">{stats.busyDoctors}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium text-gray-900">{stats.totalDoctors}</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.averageWaitTime}</div>
                <p className="text-sm text-gray-600">Avg Wait (min)</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Satisfaction:</span>
              <span className="font-medium text-green-600">{stats.patientSatisfaction}%</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-medium text-green-600">${stats.revenue}</span>
            </div>
          </div>
        </div>

        {/* Alert Cards Section */}
        {(stats.urgentPatients > 0 || stats.escalatedPatients > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            {stats.urgentPatients > 0 && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-red-800">Urgent Attention</h3>
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-700 mb-2">{stats.urgentPatients}</div>
                <p className="text-sm text-red-600 mb-4">Urgent patients waiting in queue</p>
                <Link href="/queue" className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-800 bg-red-100 px-3 py-2 rounded-md transition-colors">
                  View Queue →
                </Link>
              </div>
            )}
            
            {stats.escalatedPatients > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-orange-800">Priority Escalated</h3>
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-2">{stats.escalatedPatients}</div>
                <p className="text-sm text-orange-600 mb-4">Patients with escalated priority due to wait time</p>
                <Link href="/queue" className="inline-flex items-center text-sm font-medium text-orange-700 hover:text-orange-800 bg-orange-100 px-3 py-2 rounded-md transition-colors">
                  View Queue →
                </Link>
              </div>
            )}
          </div>
        )}



        {/* Doctor Performance Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Performance</h2>
            <p className="text-gray-600 text-sm mt-1">Today's schedule and availability overview</p>
          </div>
          <div className="p-6">
            {/* Doctor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => {
                const now = new Date()
                const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
                const isWorkingToday = doctor.workingDays?.includes(currentDay)
                const hasAvailability = doctor.availability && doctor.availability.length > 0
                const assignedPatients = queueItems.filter(p => p.doctor?.id === doctor.id && ['waiting', 'called', 'in_consultation'].includes(p.status)).length
                
                const statusColor = 
                  !isWorkingToday ? 'gray' : // Off schedule today
                  !hasAvailability ? 'red' : // No schedule set (problem)
                  doctor.status === 'available' ? 'green' : // Available and scheduled
                  doctor.status === 'busy' ? 'yellow' : // Busy with patients
                  'red' // Offline during scheduled hours
                
                const statusBg = {
                  green: 'bg-green-50 border-green-200',
                  yellow: 'bg-yellow-50 border-yellow-200', 
                  gray: 'bg-gray-50 border-gray-200',
                  red: 'bg-red-50 border-red-200'
                }[statusColor]
                
                const statusDot = {
                  green: 'bg-green-500',
                  yellow: 'bg-yellow-500',
                  gray: 'bg-gray-400', 
                  red: 'bg-red-500'
                }[statusColor]
                
                return (
                  <div key={doctor.id} className={`p-4 rounded-lg border ${statusBg} hover:shadow-md transition-shadow`}>
                    {/* Doctor Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusDot}`}></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Dr. {doctor.name}</h3>
                          <p className="text-xs text-gray-600">{doctor.specialization}</p>
                        </div>
                      </div>
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Schedule Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Schedule:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {isWorkingToday && hasAvailability 
                            ? `${doctor.availability[0]} - ${doctor.availability[doctor.availability.length - 1]}`
                            : isWorkingToday ? 'Not Set' : 'Off Today'
                          }
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Patients:</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          assignedPatients > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {assignedPatients} assigned
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Status:</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          !isWorkingToday ? 'bg-gray-100 text-gray-600' :
                          !hasAvailability ? 'bg-red-100 text-red-700' :
                          doctor.status === 'available' ? 'bg-green-100 text-green-700' :
                          doctor.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {!isWorkingToday ? 'Off Today' :
                           !hasAvailability ? 'No Schedule' :
                           doctor.status === 'available' ? 'Available' : 
                           doctor.status === 'busy' ? 'Busy' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Alert for missing schedule */}
                    {(!doctor.availability || doctor.availability.length === 0) && (
                      <div className="mt-3 flex items-center gap-2 p-2 bg-red-100 rounded text-red-700">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">No schedule set</span>
                        <Link href="/doctors" className="text-xs font-medium hover:underline ml-auto">
                          Fix →
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {doctors.filter(d => {
                      const now = new Date()
                      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
                      const isWorkingToday = d.workingDays?.includes(currentDay)
                      const hasAvailability = d.availability && d.availability.length > 0
                      return isWorkingToday && hasAvailability && d.status === 'available'
                    }).length}
                  </div>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {doctors.filter(d => {
                      const now = new Date()
                      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
                      const isWorkingToday = d.workingDays?.includes(currentDay)
                      const hasAvailability = d.availability && d.availability.length > 0
                      return isWorkingToday && hasAvailability && d.status === 'busy'
                    }).length}
                  </div>
                  <p className="text-xs text-gray-600">Busy</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {doctors.filter(d => {
                      const now = new Date()
                      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
                      const isWorkingToday = d.workingDays?.includes(currentDay)
                      return !isWorkingToday
                    }).length}
                  </div>
                  <p className="text-xs text-gray-600">Off Today</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {doctors.filter(d => !d.availability || d.availability.length === 0).length}
                  </div>
                  <p className="text-xs text-gray-600">No Schedule</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-gray-600 text-sm mt-1">Latest queue and appointment activities</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'patient_completed' ? 'bg-green-500' :
                      activity.type === 'patient_called' ? 'bg-blue-500' :
                      activity.type === 'patient_added' ? 'bg-orange-500' :
                      activity.type === 'priority_escalated' ? 'bg-red-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900">{activity.message}</span>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {activity.priority === 'urgent' && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

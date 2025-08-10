"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope, Users, Calendar, UserCheck, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated, if so redirect to dashboard
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated) {
            router.push('/dashboard')
          }
        }
      } catch (error) {
        // User not authenticated, stay on landing page
        console.log('User not authenticated')
      }
    }
    
    checkAuth()
  }, [router])

  const handleGetStarted = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl">
              <Stethoscope className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Clinic Front Desk System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Streamline your clinic operations with our comprehensive front desk management system. 
            Manage queues, appointments, and patient flow efficiently.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Queue Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Efficiently manage walk-in patients with automated queue numbering and status tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Appointment Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Book, reschedule, and cancel appointments with real-time doctor availability.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Doctor Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage doctor profiles, specializations, and availability schedules.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track patient progress and appointment status with live updates.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Our System?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-3">Streamlined Operations</h3>
              <p className="text-muted-foreground">
                Reduce wait times and improve patient satisfaction with efficient queue and appointment management.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-3">Easy to Use</h3>
              <p className="text-muted-foreground">
                Intuitive interface designed for front desk staff with minimal training required.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-3">Comprehensive Features</h3>
              <p className="text-muted-foreground">
                All-in-one solution covering queue management, appointments, and doctor administration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

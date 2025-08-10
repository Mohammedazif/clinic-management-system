import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/simple-db'

export async function GET() {
  try {
    const appointments = db.getAppointments()
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Failed to fetch appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientName, patientPhone, patientEmail, doctorId, date, time, notes, symptoms } = await request.json()
    
    // Validate required fields
    if (!patientName || !patientPhone || !doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if doctor exists
    const doctor = db.getDoctorById(doctorId)
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }

    // Check for conflicting appointments
    const existingAppointments = db.getAppointmentsByDate(date)
    const conflictingAppointment = existingAppointments.find(
      apt => apt.doctorId === doctorId && apt.time === time && apt.status === 'booked'
    )

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot already booked' },
        { status: 409 }
      )
    }

    // Create new appointment
    const newAppointment = db.createAppointment({
      patientName,
      patientPhone,
      patientEmail: patientEmail || '',
      doctorId,
      doctorName: doctor.name,
      date,
      time,
      notes: notes || '',
      symptoms: symptoms || '',
      status: 'booked'
    })
    
    return NextResponse.json(newAppointment, { status: 201 })
  } catch (error) {
    console.error('Failed to book appointment:', error)
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    )
  }
}

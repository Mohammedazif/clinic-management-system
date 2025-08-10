import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/simple-db'

export async function GET() {
  try {
    const doctors = db.getDoctors()
    return NextResponse.json(doctors)
  } catch (error) {
    console.error('Failed to fetch doctors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, specialization, gender, location, phone, email, availability, workingDays } = await request.json()
    
    // Validate required fields
    if (!name || !specialization || !gender || !location || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const newDoctor = db.createDoctor({
      name,
      specialization,
      gender,
      location,
      phone,
      email,
      availability: availability || ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true
    })
    
    return NextResponse.json(newDoctor, { status: 201 })
  } catch (error) {
    console.error('Failed to add doctor:', error)
    return NextResponse.json(
      { error: 'Failed to add doctor' },
      { status: 500 }
    )
  }
}

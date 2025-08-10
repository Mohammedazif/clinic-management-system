import { NextRequest, NextResponse } from 'next/server'

// This would be imported from your doctors route in a real app
let doctorsData = [
  {
    id: '1',
    name: 'Smith',
    specialization: 'General Medicine',
    gender: 'male' as const,
    location: 'Room 101',
    availability: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    status: 'available' as const,
    phone: '+1234567894',
    email: 'dr.smith@clinic.com'
  },
  {
    id: '2',
    name: 'Johnson',
    specialization: 'Cardiology',
    gender: 'female' as const,
    location: 'Room 102',
    availability: ['10:00', '11:00', '14:00', '15:00', '16:00'],
    status: 'busy' as const,
    phone: '+1234567895',
    email: 'dr.johnson@clinic.com'
  },
  {
    id: '3',
    name: 'Brown',
    specialization: 'Pediatrics',
    gender: 'female' as const,
    location: 'Room 103',
    availability: ['09:00', '10:00', '14:00', '15:00'],
    status: 'available' as const,
    phone: '+1234567896',
    email: 'dr.brown@clinic.com'
  }
]

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedDoctor = await request.json()
    const doctorIndex = doctorsData.findIndex(d => d.id === params.id)
    
    if (doctorIndex === -1) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }
    
    doctorsData[doctorIndex] = { ...doctorsData[doctorIndex], ...updatedDoctor }
    
    return NextResponse.json(doctorsData[doctorIndex])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update doctor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorIndex = doctorsData.findIndex(d => d.id === params.id)
    
    if (doctorIndex === -1) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }
    
    const deletedDoctor = doctorsData.splice(doctorIndex, 1)[0]
    
    return NextResponse.json(deletedDoctor)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete doctor' },
      { status: 500 }
    )
  }
}

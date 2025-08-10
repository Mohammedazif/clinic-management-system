import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/simple-db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const updates = await request.json()
    const updatedAppointment = db.updateAppointment(id, updates)
    
    if (!updatedAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Failed to update appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deletedAppointment = db.deleteAppointment(id)
    
    if (!deletedAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Failed to delete appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}

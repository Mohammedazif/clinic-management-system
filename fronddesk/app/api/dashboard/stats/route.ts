import { NextResponse } from 'next/server'

// Mock data - in production, this would come from your database
const mockStats = {
  totalPatients: 45,
  todayAppointments: 12,
  queueLength: 8,
  completedToday: 15
}

export async function GET() {
  try {
    return NextResponse.json(mockStats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

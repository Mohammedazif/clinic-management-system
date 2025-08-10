import { NextRequest, NextResponse } from 'next/server'

// Mock data - in production, this would be stored in your database
let queueData = [
  {
    id: '1',
    queueNumber: 'Q001',
    name: 'John Doe',
    phone: '+1234567890',
    status: 'waiting' as const,
    priority: 'normal' as const,
    addedAt: new Date().toISOString(),
    estimatedWait: 15
  },
  {
    id: '2',
    queueNumber: 'Q002',
    name: 'Jane Smith',
    phone: '+1234567891',
    status: 'with-doctor' as const,
    priority: 'urgent' as const,
    addedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    estimatedWait: 5
  }
]

let queueCounter = 3

export async function GET() {
  try {
    return NextResponse.json(queueData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, priority } = await request.json()
    
    const newPatient = {
      id: queueCounter.toString(),
      queueNumber: `Q${queueCounter.toString().padStart(3, '0')}`,
      name,
      phone,
      status: 'waiting' as const,
      priority: priority || 'normal',
      addedAt: new Date().toISOString(),
      estimatedWait: queueData.filter(p => p.status === 'waiting').length * 15
    }
    
    queueData.push(newPatient)
    queueCounter++
    
    return NextResponse.json(newPatient, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add patient to queue' },
      { status: 500 }
    )
  }
}

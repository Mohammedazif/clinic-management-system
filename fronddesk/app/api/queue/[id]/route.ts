import { NextRequest, NextResponse } from 'next/server'

// This would be imported from your queue route in a real app
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    const patientIndex = queueData.findIndex(p => p.id === params.id)
    
    if (patientIndex === -1) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    
    queueData[patientIndex].status = status
    
    return NextResponse.json(queueData[patientIndex])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update patient status' },
      { status: 500 }
    )
  }
}

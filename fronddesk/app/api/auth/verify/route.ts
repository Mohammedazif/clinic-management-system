import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')
    
    if (token && token.value === 'authenticated-user-token') {
      return NextResponse.json({ 
        authenticated: true,
        user: { username: 'frontdesk', role: 'front_desk' }
      })
    } else {
      return NextResponse.json(
        { authenticated: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

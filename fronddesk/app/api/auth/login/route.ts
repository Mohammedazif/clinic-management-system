import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Simple authentication (in production, use proper password hashing)
    if (username === 'frontdesk' && password === 'admin123') {
      const cookieStore = await cookies()
      
      // Set authentication cookie with proper settings
      cookieStore.set('auth-token', 'authenticated-user-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        redirect: '/dashboard'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error occurred' },
      { status: 500 }
    )
  }
}

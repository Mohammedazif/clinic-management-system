"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Users, Calendar, UserCheck, Menu, LogOut, Stethoscope } from 'lucide-react'
import { authAPI, clearAuthToken, hasAuthToken } from '@/lib/api'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Simple authentication check - just verify token exists
    const checkAuth = () => {
      const tokenExists = hasAuthToken()
      console.log('Dashboard auth check - Token found:', tokenExists)
      
      if (!tokenExists) {
        console.log('No token found, redirecting to login')
        clearAuthToken()
        router.push('/login')
      } else {
        console.log('Token exists, allowing dashboard access')
      }
    }
    
    // Add a small delay to ensure localStorage is ready
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      clearAuthToken()
      // Force page refresh to clear any cached state
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if logout request fails
      clearAuthToken()
      window.location.href = '/login'
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Queue Management', href: '/queue', icon: Users },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Doctors', href: '/doctors', icon: UserCheck },
  ]

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-muted/40 border-r">
          <div className="flex items-center flex-shrink-0 px-4 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Clinic System</h1>
                <p className="text-sm text-muted-foreground">Front Desk</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <NavItems />
          </nav>
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col flex-1 md:pl-0">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-background border-b md:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Clinic System</h1>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <div className="p-2 bg-primary rounded-lg">
                    <Stethoscope className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold">Clinic System</h1>
                    <p className="text-sm text-muted-foreground">Front Desk</p>
                  </div>
                </div>
                <nav className="flex-1 pt-4 space-y-2">
                  <NavItems />
                </nav>
                <div className="pt-4 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

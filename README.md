# 🏥 Clinic Management System 

A modern, responsive Next.js frontend application for comprehensive clinic management with intelligent automation, real-time updates, and professional medical workflow optimization.

## ✨ Key Features

### 🎯 Dashboard & Analytics
- **Real-time Statistics** with live updates every 30 seconds
- **Key Metrics Display** (Queue, Appointments, Doctors, Performance)
- **Alert System** for urgent and escalated patients
- **Doctor Performance Overview** with status indicators
- **Recent Activity Feed** combining queue and appointment events
- **Professional Medical UI** with clean, consistent design

### 👨‍⚕️ Advanced Doctor Management
- **4-Step Doctor Wizard** for comprehensive profile creation
- **Schedule Management** with working days and time slot selection
- **Automatic Status Updates** based on real-time schedule awareness
- **Quick Templates** for common schedules (Standard, Morning, Evening)
- **Search & Filtering** by specialization, status, gender, experience
- **Bulk Operations** (Set All Available/Offline)
- **Statistics Dashboard** with availability breakdown

### 📅 Intelligent Appointment System
- **4-Step Booking Wizard** with patient information capture
- **Medical Details Integration** (symptoms, history, medications, allergies)
- **Insurance Information** capture and management
- **Real-time Conflict Detection** and prevention
- **Schedule-aware Availability** checking
- **Rescheduling Functionality** with pre-filled data
- **Priority Management** (Low, Normal, High, Urgent)
- **Comprehensive Filtering** and search capabilities

### 🏃‍♂️ Smart Queue Management
- **Daily Queue System** with automatic numbering
- **Priority-based Ordering** with visual escalation indicators
- **Real-time Wait Time** calculations and display
- **Doctor Assignment** with workload balancing
- **Call Next System** with doctor-specific queues
- **Auto-refresh** every 30 seconds for live updates
- **Available Doctors** display with status and fees

### 🤖 Automation & Intelligence
- **Schedule-aware Doctor Status** (auto-offline when schedule ends)
- **Automatic Priority Escalation** based on wait times
- **Real-time Data Synchronization** across all components
- **Smart Doctor Assignment** based on availability and workload
- **Hydration Error Prevention** with client-side time handling
- **Professional Workflow** matching real clinic operations

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.0.0** - React framework with App Router
- **React 18.2.0** - Component-based UI library
- **TypeScript 5.1.6** - Type-safe development

### Styling & UI
- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-checkbox` - Form checkboxes
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-select` - Dropdown selects
- **Lucide React 0.263.1** - Beautiful icon library
- **Class Variance Authority** - Component variant management
- **Tailwind Merge & clsx** - Conditional styling utilities

### Authentication & Security
- **JWT Authentication** with secure token handling
- **bcryptjs** - Password hashing (client-side utilities)
- **Local Storage** - Secure token persistence
- **Protected Routes** - Authentication-based navigation

### Data Management
- **Custom API Layer** (`/lib/api.ts`) - Centralized API calls
- **React Hooks** - State management (useState, useEffect)
- **Real-time Updates** - Automatic data refresh
- **Error Handling** - Comprehensive error management
- **Loading States** - User feedback during operations

## 📱 Pages & Components

### Core Pages
- **Dashboard** (`/dashboard`) - Main overview with statistics and alerts
- **Appointments** (`/appointments`) - Complete appointment management
- **Queue Management** (`/queue`) - Real-time patient queue
- **Doctor Management** (`/doctors`) - Doctor profiles and scheduling
- **Login** (`/login`) - Authentication portal

### Key Components
- **DashboardLayout** - Consistent layout wrapper
- **Dialog Components** - Modal interfaces for forms
- **Statistics Cards** - Real-time metric displays
- **Doctor Cards** - Comprehensive doctor information
- **Appointment Cards** - Detailed appointment views
- **Queue Items** - Patient queue entries with status

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Backend API** running on port 3001

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd fronddesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-key-here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials
- **Admin**: `admin` / `password123`
- **Front Desk**: `frontdesk1` / `password123`

## 🔧 Available Scripts

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build production application
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
```

### Production Build
```bash
npm run build        # Create optimized production build
npm run start        # Serve production build locally
```

## 🌐 Environment Variables

### Development (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key
```

### Production (.env.production)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api

# Authentication
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-super-secure-production-secret
```

## 📋 Project Structure

```
fronddesk/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Dashboard page
│   ├── appointments/            # Appointment management
│   ├── queue/                   # Queue management
│   ├── doctors/                 # Doctor management
│   ├── login/                   # Authentication
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # Reusable components
│   ├── ui/                      # UI primitives
│   └── dashboard-layout.tsx     # Layout component
├── lib/                         # Utilities
│   └── api.ts                   # API service layer
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json                 # Dependencies and scripts
```

## 🎨 Design System

### Color Scheme
- **Primary**: Blue tones for actions and navigation
- **Success**: Green for positive states and available status
- **Warning**: Yellow/Orange for busy states and alerts
- **Danger**: Red for urgent states and errors
- **Neutral**: Gray tones for text and backgrounds

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, professional
- **Monospace**: Code and technical data

### Component Patterns
- **Card-based Layout** - Consistent information grouping
- **Status Indicators** - Color-coded visual feedback
- **Progressive Disclosure** - Step-by-step workflows
- **Real-time Updates** - Live data synchronization

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect Repository**: Link GitHub repo to Vercel
2. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Root Directory: `fronddesk`
3. **Set Environment Variables**: Add production environment variables
4. **Deploy**: Automatic deployment on push

### Railway
1. **Create Service**: Add frontend service to Railway project
2. **Configure**:
   - Root Directory: `/fronddesk`
   - Build Command: `npm run build`
   - Start Command: `npm start`
3. **Environment Variables**: Set production API URL
4. **Deploy**: Automatic build and deployment

### Manual Deployment
1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

## 🔍 Key Features Deep Dive

### Dashboard Intelligence
- **Live Statistics** update every 30 seconds
- **Alert System** shows urgent/escalated patients only when needed
- **Recent Activity** combines queue and appointment events with proper doctor name lookup
- **Doctor Performance** shows realistic clinic status with schedule awareness

### Appointment Workflow
- **4-Step Wizard** guides through comprehensive patient data collection
- **Conflict Detection** prevents double-booking with real-time validation
- **Rescheduling** pre-fills existing data and skips patient details
- **Medical Integration** captures symptoms, history, medications, and allergies

### Queue Intelligence
- **Daily Reset** queue numbers restart each day
- **Priority Escalation** automatically increases priority based on wait time
- **Doctor Assignment** balances workload and considers availability
- **Real-time Updates** keep all users synchronized

### Doctor Management
- **Schedule Awareness** automatically manages status based on working hours
- **Bulk Operations** for efficient clinic management
- **Comprehensive Search** across all doctor attributes
- **Statistics Dashboard** provides operational insights

## 🛡️ Security Features

- **JWT Token Management** with secure storage and automatic refresh
- **Protected Routes** prevent unauthorized access
- **Input Validation** on all forms and data entry
- **XSS Prevention** through React's built-in protections
- **CSRF Protection** via SameSite cookie policies

## 📈 Performance Optimizations

- **Next.js App Router** for optimal performance
- **Automatic Code Splitting** reduces bundle sizes
- **Image Optimization** with Next.js Image component
- **Static Generation** where applicable
- **Client-side Caching** for API responses

## 🔧 Troubleshooting

### Common Issues

#### API Connection Error
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Verify environment variables
echo $NEXT_PUBLIC_API_URL
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Authentication Issues
```bash
# Check JWT token in browser localStorage
# Verify backend authentication endpoints
# Ensure CORS is configured correctly
```

## 📚 Additional Resources

- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **React Documentation**: [react.dev](https://react.dev)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **Radix UI**: [radix-ui.com](https://radix-ui.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Test your changes thoroughly
5. Submit a pull request

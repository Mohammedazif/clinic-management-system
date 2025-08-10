# 🏥 Clinic Management System - Backend API

A comprehensive NestJS backend API for managing complete clinic operations including appointments, doctors, users, patient queues, and schedule management with intelligent automation features.

## ✨ Key Features

### 🔐 Authentication & Authorization
- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (Admin, Front Desk, Doctor)
- **Secure Password Hashing** with bcryptjs
- **Session Management** with automatic token expiration

### 👨‍⚕️ Doctor Management
- **Complete CRUD Operations** for doctor profiles
- **Schedule Management** with working days and time slots
- **Automatic Status Updates** based on schedule
- **Specialization & Location Tracking**
- **Consultation Fee & Duration Management**
- **Experience & License Number Tracking**

### 📅 Advanced Appointment System
- **4-Step Booking Wizard** with comprehensive patient data
- **Schedule Conflict Detection** and prevention
- **Rescheduling Functionality** with availability checking
- **Priority Levels** (Low, Normal, High, Urgent)
- **Medical History Integration** (symptoms, medications, allergies)
- **Insurance Information** capture and management
- **Real-time Availability** checking

### 🏃‍♂️ Intelligent Queue Management
- **Daily Queue Numbers** with automatic reset
- **Priority-based Ordering** with automatic escalation
- **Wait Time Calculations** with real-time updates
- **Doctor Assignment** with workload balancing
- **Call Next System** with doctor-specific queues
- **Status Tracking** (Waiting, Called, In Consultation)

### 📊 Analytics & Reporting
- **Real-time Statistics** for dashboard
- **Doctor Performance Metrics**
- **Patient Wait Time Analytics**
- **Appointment Success Rates**
- **Queue Efficiency Tracking**

### 🤖 Automation Features
- **Schedule-aware Status Management**
- **Automatic Priority Escalation** (30min → Normal, 60min → High, 90min → Urgent)
- **Auto-offline Doctors** when schedule ends
- **Smart Doctor Assignment** based on availability and workload

## 🛠️ Technology Stack

### Core Framework
- **NestJS 11.1.6** - Progressive Node.js framework
- **TypeScript 5.9.2** - Type-safe development
- **Node.js** - Runtime environment

### Database & ORM
- **MySQL 8.0** - Relational database
- **TypeORM 0.3.25** - Object-Relational Mapping
- **mysql2 3.14.3** - MySQL driver
- **Database Migrations** - Version control for schema
- **Seeding System** - Sample data generation

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcryptjs** - Password hashing
- **Class-validator** - Input validation
- **Class-transformer** - Data transformation

### API & Validation
- **RESTful API Design** - Standard HTTP methods
- **Comprehensive Validation** - Request/response validation
- **Error Handling** - Structured error responses
- **CORS Configuration** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_DATABASE=clinic_frontend_db
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE clinic_frontend_db;
   ```

5. **Run database migrations and seed data**
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001/api`

## 🔐 Default Login Credentials

After seeding the database, use these credentials:

- **Admin**: `admin` / `password123`
- **Front Desk Staff**: `frontdesk1` / `password123`
- **Front Desk Staff**: `frontdesk2` / `password123`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/activate` - Activate user
- `PATCH /api/users/:id/deactivate` - Deactivate user

### Doctors
- `GET /api/doctors` - Get all doctors (with filters)
- `POST /api/doctors` - Create new doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `PATCH /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/stats` - Get doctor statistics
- `PATCH /api/doctors/:id/activate` - Activate doctor
- `PATCH /api/doctors/:id/deactivate` - Deactivate doctor

### Appointments
- `GET /api/appointments` - Get all appointments (with filters)
- `POST /api/appointments` - Book new appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/stats` - Get appointment statistics
- `PATCH /api/appointments/:id/status` - Update appointment status
- `POST /api/appointments/:id/reschedule` - Reschedule appointment

### Queue Management
- `GET /api/queue` - Get queue items (with filters)
- `POST /api/queue` - Add patient to queue
- `GET /api/queue/:id` - Get queue item by ID
- `PATCH /api/queue/:id` - Update queue item
- `DELETE /api/queue/:id` - Remove from queue
- `GET /api/queue/stats` - Get queue statistics
- `GET /api/queue/active` - Get active queue
- `GET /api/queue/waiting` - Get waiting queue
- `POST /api/queue/call-next` - Call next patient
- `PATCH /api/queue/:id/status` - Update queue status
- `PATCH /api/queue/:id/assign-doctor` - Assign doctor to patient

## 🗄️ Database Schema

### Users Table
```sql
- id: Primary key
- username: Unique username
- email: User email
- password: Hashed password
- role: ADMIN, FRONT_DESK, DOCTOR
- firstName: User's first name
- lastName: User's last name
- isActive: Account status
- createdAt: Creation timestamp
- updatedAt: Last update timestamp
```

### Doctors Table
```sql
- id: Primary key
- name: Doctor's full name
- specialization: Medical specialization
- gender: male, female, other
- location: Clinic location/room
- phone: Contact phone number
- email: Contact email
- licenseNumber: Medical license number
- experience: Years of experience
- bio: Doctor's biography
- consultationFee: Fee per consultation
- consultationDuration: Duration in minutes
- availability: JSON array of time slots
- workingDays: JSON array of working days
- status: available, busy, offline
- isActive: Account status
- createdAt: Creation timestamp
- updatedAt: Last update timestamp
```

### Appointments Table
```sql
- id: Primary key
- patientName: Patient's full name
- patientAge: Patient's age
- patientGender: Patient's gender
- patientPhone: Contact phone
- patientEmail: Contact email
- patientAddress: Patient's address
- emergencyContact: Emergency contact info
- symptoms: Patient's symptoms
- medicalHistory: Medical history
- currentMedications: Current medications
- allergies: Known allergies
- insuranceProvider: Insurance company
- insuranceNumber: Insurance policy number
- appointmentType: consultation, follow-up, checkup, emergency
- priority: low, normal, high, urgent
- doctorId: Foreign key to doctors
- appointmentDate: Scheduled date
- appointmentTime: Scheduled time
- status: scheduled, completed, cancelled, rescheduled
- notes: Additional notes
- createdAt: Creation timestamp
- updatedAt: Last update timestamp
```

### Queue Items Table
```sql
- id: Primary key
- queueNumber: Daily queue number
- queueDate: Date of queue entry
- patientName: Patient's name
- patientAge: Patient's age
- patientPhone: Contact phone
- symptoms: Chief complaint
- priority: low, normal, high, urgent
- doctorId: Assigned doctor (nullable)
- status: waiting, called, in_consultation, completed
- estimatedWaitTime: Calculated wait time
- createdAt: Queue entry time
- updatedAt: Last status update
```

## 🔧 Available Scripts

### Development
```bash
npm run start:dev          # Start in development mode with hot reload
npm run start:debug        # Start in debug mode
npm run build              # Build the application
npm run start:prod         # Start in production mode
```

### Database Operations
```bash
npm run typeorm            # Run TypeORM CLI commands
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed              # Seed database with sample data
```

### Testing & Quality
```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run end-to-end tests
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
```

## 🌐 Environment Variables

### Development (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=clinic_frontend_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Production (.env.production)
```env
# Database Configuration (provided by hosting service)
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-production-password
DB_DATABASE=clinic_db

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-key
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

## 🚀 Deployment

### Railway (Recommended)
1. **Connect Repository**: Link your GitHub repo to Railway
2. **Add MySQL Service**: Add MySQL database to your project
3. **Set Environment Variables**: Configure production environment variables
4. **Deploy**: Railway automatically builds and deploys

### Manual Deployment
1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Run Migrations**:
   ```bash
   npm run migration:run
   ```

3. **Seed Database** (optional):
   ```bash
   npm run seed
   ```

4. **Start Production Server**:
   ```bash
   npm run start:prod
   ```

## 🔍 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## 🧪 Testing

### Sample API Calls

#### Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'

# Get Profile (with token)
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Doctors
```bash
# Get all doctors
curl -X GET http://localhost:3001/api/doctors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create doctor
curl -X POST http://localhost:3001/api/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Dr. Smith", "specialization": "Cardiology", ...}'
```

## 🛡️ Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcryptjs with salt rounds
- **Input Validation** with class-validator decorators
- **SQL Injection Prevention** through TypeORM parameterized queries
- **CORS Protection** with configurable origins
- **Rate Limiting** (can be added with @nestjs/throttler)
- **Helmet Security Headers** (can be added with helmet)

## 📈 Performance Features

- **Database Indexing** on frequently queried fields
- **Connection Pooling** for database connections
- **Caching** (can be added with @nestjs/cache-manager)
- **Compression** (can be added with compression middleware)
- **Pagination** for large data sets

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check MySQL service is running
sudo service mysql status

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"
```

#### Migration Errors
```bash
# Reset migrations (development only)
npm run migration:revert
npm run migration:run
```

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 PID
```

## 📚 Additional Resources

- **NestJS Documentation**: [nestjs.com](https://nestjs.com)
- **TypeORM Documentation**: [typeorm.io](https://typeorm.io)
- **MySQL Documentation**: [dev.mysql.com](https://dev.mysql.com/doc/)
- **JWT Documentation**: [jwt.io](https://jwt.io)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for modern clinic management**

### Doctors Table
- Doctor profiles with specializations
- Availability schedules and working days
- Status tracking (AVAILABLE, BUSY, OFFLINE)

### Appointments Table
- Patient appointment bookings
- Status tracking (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- Patient information and consultation details

### Queue Items Table
- Real-time patient queue management
- Priority levels (LOW, NORMAL, HIGH, URGENT)
- Status tracking (WAITING, CALLED, IN_PROGRESS, COMPLETED)

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Request validation and sanitization
- **CORS Protection** - Cross-origin request handling
- **Role-based Access** - Different permission levels

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode
- `npm run start:prod` - Start in production mode
- `npm run seed` - Seed the database with sample data
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Run database migrations**
   ```bash
   npm run migration:run
   ```

4. **Start the application**
   ```bash
   npm run start:prod
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

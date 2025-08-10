import { getDatabase } from './database'
import { User } from './entities/User'
import { Doctor } from './entities/Doctor'
import { Appointment } from './entities/Appointment'
import { QueueItem } from './entities/QueueItem'
import * as bcrypt from 'bcryptjs'

export async function seedDatabase() {
  const dataSource = await getDatabase()

  // Seed Users
  const userRepository = dataSource.getRepository(User)
  const existingUser = await userRepository.findOne({ where: { username: 'frontdesk' } })
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const user = userRepository.create({
      username: 'frontdesk',
      password: hashedPassword,
      fullName: 'Front Desk Staff',
      role: 'front_desk'
    })
    await userRepository.save(user)
    console.log('Default user created: frontdesk/admin123')
  }

  // Seed Doctors
  const doctorRepository = dataSource.getRepository(Doctor)
  const doctorCount = await doctorRepository.count()
  
  if (doctorCount === 0) {
    const doctors = [
      {
        name: 'Dr. Sarah Smith',
        specialization: 'General Medicine',
        gender: 'Female',
        location: 'Room 101',
        phone: '+1234567890',
        email: 'sarah.smith@clinic.com',
        availability: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      {
        name: 'Dr. Michael Johnson',
        specialization: 'Cardiology',
        gender: 'Male',
        location: 'Room 102',
        phone: '+1234567891',
        email: 'michael.johnson@clinic.com',
        availability: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        workingDays: ['Monday', 'Wednesday', 'Friday']
      },
      {
        name: 'Dr. Emily Brown',
        specialization: 'Pediatrics',
        gender: 'Female',
        location: 'Room 103',
        phone: '+1234567892',
        email: 'emily.brown@clinic.com',
        availability: ['10:00', '11:00', '14:00', '15:00', '16:00'],
        workingDays: ['Tuesday', 'Thursday', 'Saturday']
      }
    ]

    for (const doctorData of doctors) {
      const doctor = doctorRepository.create(doctorData)
      await doctorRepository.save(doctor)
    }
    console.log('Sample doctors created')
  }

  // Seed some sample appointments
  const appointmentRepository = dataSource.getRepository(Appointment)
  const appointmentCount = await appointmentRepository.count()
  
  if (appointmentCount === 0) {
    const doctors = await doctorRepository.find()
    const today = new Date().toISOString().split('T')[0]
    
    const appointments = [
      {
        patientName: 'Alice Johnson',
        patientPhone: '+1234567893',
        patientEmail: 'alice.johnson@email.com',
        doctorId: doctors[0].id,
        date: today,
        time: '09:00',
        status: 'booked' as const,
        notes: 'Regular checkup',
        symptoms: 'General wellness check'
      },
      {
        patientName: 'Bob Wilson',
        patientPhone: '+1234567894',
        patientEmail: 'bob.wilson@email.com',
        doctorId: doctors[1].id,
        date: today,
        time: '10:00',
        status: 'completed' as const,
        notes: 'Follow-up visit',
        symptoms: 'Chest pain follow-up'
      }
    ]

    for (const appointmentData of appointments) {
      const appointment = appointmentRepository.create(appointmentData)
      await appointmentRepository.save(appointment)
    }
    console.log('Sample appointments created')
  }

  console.log('Database seeding completed!')
}

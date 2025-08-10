import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../entities/user.entity';
import { Doctor, DoctorGender, DoctorStatus } from '../../entities/doctor.entity';
import { Appointment, AppointmentStatus } from '../../entities/appointment.entity';
import { QueueItem, QueueStatus, QueuePriority } from '../../entities/queue-item.entity';

// Database connection configuration
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'clinic_user',
  password: process.env.DB_PASSWORD || 'clinic_password',
  database: process.env.DB_DATABASE || 'clinic_frontend_db',
  entities: [User, Doctor, Appointment, QueueItem],
  synchronize: true,
  logging: false,
});

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Clear existing data
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await AppDataSource.query('TRUNCATE TABLE appointments');
    await AppDataSource.query('TRUNCATE TABLE queue_items');
    await AppDataSource.query('TRUNCATE TABLE doctors');
    await AppDataSource.query('TRUNCATE TABLE users');
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🗑️  Cleared existing data');

    // Seed Users
    const userRepository = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await userRepository.save([
      {
        username: 'admin',
        email: 'admin@clinic.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        phone: '+1234567890',
        isActive: true,
      },
      {
        username: 'frontdesk1',
        email: 'frontdesk1@clinic.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.FRONT_DESK,
        phone: '+1234567891',
        isActive: true,
      },
      {
        username: 'frontdesk2',
        email: 'frontdesk2@clinic.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Davis',
        role: UserRole.FRONT_DESK,
        phone: '+1234567892',
        isActive: true,
      },
    ]);
    console.log('👥 Created users:', users.length);

    // Seed Doctors
    const doctorRepository = AppDataSource.getRepository(Doctor);
    const doctors = await doctorRepository.save([
      {
        name: 'Dr. Smith',
        specialization: 'General Medicine',
        gender: DoctorGender.MALE,
        location: 'Room 101',
        email: 'dr.smith@clinic.com',
        phone: '+1234567894',
        availability: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: DoctorStatus.AVAILABLE,
        isActive: true,
        licenseNumber: 'MD12345',
        experience: 10,
        bio: 'Experienced general practitioner with 10 years of practice.',
        consultationFee: 150,
      },
      {
        name: 'Dr. Johnson',
        specialization: 'Cardiology',
        gender: DoctorGender.FEMALE,
        location: 'Room 102',
        email: 'dr.johnson@clinic.com',
        phone: '+1234567895',
        availability: ['10:00', '11:00', '14:00', '15:00', '16:00'],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: DoctorStatus.AVAILABLE,
        isActive: true,
        licenseNumber: 'MD12346',
        experience: 15,
        bio: 'Specialist in cardiovascular diseases and heart conditions.',
        consultationFee: 200,
      },
      {
        name: 'Dr. Brown',
        specialization: 'Pediatrics',
        gender: DoctorGender.FEMALE,
        location: 'Room 103',
        email: 'dr.brown@clinic.com',
        phone: '+1234567896',
        availability: ['09:00', '10:00', '14:00', '15:00'],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: DoctorStatus.AVAILABLE,
        isActive: true,
        licenseNumber: 'MD12347',
        experience: 8,
        bio: 'Dedicated pediatrician specializing in child healthcare.',
        consultationFee: 180,
      },
      {
        name: 'Dr. Wilson',
        specialization: 'Orthopedics',
        gender: DoctorGender.MALE,
        location: 'Room 104',
        email: 'dr.wilson@clinic.com',
        phone: '+1234567897',
        availability: ['09:00', '11:00', '14:00', '16:00'],
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        status: DoctorStatus.AVAILABLE,
        isActive: true,
        licenseNumber: 'MD12348',
        experience: 12,
        bio: 'Orthopedic surgeon specializing in bone and joint treatments.',
        consultationFee: 250,
      },
    ]);
    console.log('👨‍⚕️ Created doctors:', doctors.length);

    // Seed Appointments
    const appointmentRepository = AppDataSource.getRepository(Appointment);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const appointments = await appointmentRepository.save([
      {
        patientName: 'John Doe',
        patientPhone: '+1234567801',
        patientEmail: 'john.doe@email.com',
        patientAge: 35,
        patientGender: 'male',
        doctorId: doctors[0].id,
        date: today.toISOString().split('T')[0],
        time: '09:00',
        status: AppointmentStatus.SCHEDULED,
        notes: 'Regular checkup',
        symptoms: 'General wellness check',
        consultationFee: 150,
      },
      {
        patientName: 'Jane Smith',
        patientPhone: '+1234567802',
        patientEmail: 'jane.smith@email.com',
        patientAge: 28,
        patientGender: 'female',
        doctorId: doctors[1].id,
        date: today.toISOString().split('T')[0],
        time: '10:00',
        status: AppointmentStatus.COMPLETED,
        notes: 'Heart palpitations consultation',
        symptoms: 'Irregular heartbeat, chest discomfort',
        consultationFee: 200,
      },
      {
        patientName: 'Robert Johnson',
        patientPhone: '+1234567803',
        patientEmail: 'robert.johnson@email.com',
        patientAge: 42,
        patientGender: 'male',
        doctorId: doctors[0].id,
        date: tomorrow.toISOString().split('T')[0],
        time: '14:00',
        status: AppointmentStatus.SCHEDULED,
        notes: 'Follow-up appointment',
        symptoms: 'Back pain follow-up',
        consultationFee: 150,
      },
      {
        patientName: 'Emily Davis',
        patientPhone: '+1234567804',
        patientEmail: 'emily.davis@email.com',
        patientAge: 8,
        patientGender: 'female',
        doctorId: doctors[2].id,
        date: tomorrow.toISOString().split('T')[0],
        time: '15:00',
        status: AppointmentStatus.SCHEDULED,
        notes: 'Vaccination appointment',
        symptoms: 'Routine vaccination',
        consultationFee: 180,
      },
    ]);
    console.log('📅 Created appointments:', appointments.length);

    // Seed Queue Items
    const queueRepository = AppDataSource.getRepository(QueueItem);
    const queueItems = await queueRepository.save([
      {
        queueNumber: 1,
        patientName: 'Michael Brown',
        patientPhone: '+1234567805',
        patientAge: 45,
        status: QueueStatus.WAITING,
        priority: QueuePriority.NORMAL,
        reason: 'General consultation',
        notes: 'Walk-in patient',
        doctorId: doctors[0].id,
        estimatedWaitTime: 15,
      },
      {
        queueNumber: 2,
        patientName: 'Lisa Wilson',
        patientPhone: '+1234567806',
        patientAge: 32,
        status: QueueStatus.CALLED,
        priority: QueuePriority.HIGH,
        reason: 'Urgent care',
        notes: 'Patient with severe headache',
        doctorId: doctors[0].id,
        estimatedWaitTime: 5,
        calledAt: new Date(),
      },
      {
        queueNumber: 3,
        patientName: 'David Garcia',
        patientPhone: '+1234567807',
        patientAge: 29,
        status: QueueStatus.WAITING,
        priority: QueuePriority.NORMAL,
        reason: 'Routine checkup',
        notes: 'Annual physical examination',
        estimatedWaitTime: 25,
      },
    ]);
    console.log('🏥 Created queue items:', queueItems.length);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Doctors: ${doctors.length}`);
    console.log(`   Appointments: ${appointments.length}`);
    console.log(`   Queue Items: ${queueItems.length}`);
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Admin: admin / password123');
    console.log('   Front Desk: frontdesk1 / password123');
    console.log('   Front Desk: frontdesk2 / password123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seeding
seed();

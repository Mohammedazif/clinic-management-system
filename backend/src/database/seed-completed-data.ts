import { DataSource } from 'typeorm';
import { QueueItem, QueueStatus, QueuePriority } from '../entities/queue-item.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';

export async function seedCompletedData(dataSource: DataSource) {
  const queueRepository = dataSource.getRepository(QueueItem);
  const appointmentRepository = dataSource.getRepository(Appointment);
  const doctorRepository = dataSource.getRepository(Doctor);

  console.log('🌱 Seeding completed patients data...');

  // Get existing doctors
  const doctors = await doctorRepository.find({ where: { isActive: true } });
  if (doctors.length === 0) {
    console.log('❌ No active doctors found. Please seed doctors first.');
    return;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Create completed queue items for today
  const completedQueueItems = [];
  for (let i = 1; i <= 15; i++) {
    const doctor = doctors[i % doctors.length];
    const createdTime = new Date(todayStart.getTime() + (i * 30 * 60 * 1000)); // 30 min intervals
    const consultationStarted = new Date(createdTime.getTime() + (20 * 60 * 1000)); // 20 min wait
    const consultationEnded = new Date(consultationStarted.getTime() + (15 * 60 * 1000)); // 15 min consultation

    const queueItem = queueRepository.create({
      queueNumber: i,
      queueDate: today,
      patientName: `Patient ${i}`,
      patientPhone: `+1234567${String(i).padStart(3, '0')}`,
      patientAge: 25 + (i % 50),
      status: QueueStatus.COMPLETED,
      priority: i % 4 === 0 ? QueuePriority.HIGH : QueuePriority.NORMAL,
      reason: `Consultation ${i}`,
      notes: `Completed consultation for patient ${i}`,
      doctorId: doctor.id,
      createdAt: createdTime,
      calledAt: new Date(createdTime.getTime() + (15 * 60 * 1000)),
      consultationStartedAt: consultationStarted,
      consultationEndedAt: consultationEnded,
    });

    completedQueueItems.push(queueItem);
  }

  // Create completed appointments for today
  const completedAppointments = [];
  for (let i = 1; i <= 10; i++) {
    const doctor = doctors[i % doctors.length];
    const timeSlot = doctor.availability[i % doctor.availability.length];

    const appointment = appointmentRepository.create({
      patientName: `Appointment Patient ${i}`,
      patientPhone: `+1987654${String(i).padStart(3, '0')}`,
      patientEmail: `patient${i}@example.com`,
      patientAge: 30 + (i % 40),
      patientGender: i % 2 === 0 ? 'male' : 'female',
      date: today,
      time: timeSlot,
      status: AppointmentStatus.COMPLETED,
      notes: `Completed appointment ${i}`,
      symptoms: `Symptoms for patient ${i}`,
      diagnosis: `Diagnosis for patient ${i}`,
      prescription: `Prescription for patient ${i}`,
      consultationFee: doctor.consultationFee,
      doctorId: doctor.id,
    });

    completedAppointments.push(appointment);
  }

  try {
    // Save completed queue items
    await queueRepository.save(completedQueueItems);
    console.log(`✅ Created ${completedQueueItems.length} completed queue items for today`);

    // Save completed appointments
    await appointmentRepository.save(completedAppointments);
    console.log(`✅ Created ${completedAppointments.length} completed appointments for today`);

    console.log('🎉 Completed data seeding finished successfully!');
    console.log(`📊 Total completed today: ${completedQueueItems.length + completedAppointments.length}`);
  } catch (error) {
    console.error('❌ Error seeding completed data:', error);
    throw error;
  }
}

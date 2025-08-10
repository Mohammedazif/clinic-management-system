"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCompletedData = seedCompletedData;
const queue_item_entity_1 = require("../entities/queue-item.entity");
const appointment_entity_1 = require("../entities/appointment.entity");
const doctor_entity_1 = require("../entities/doctor.entity");
async function seedCompletedData(dataSource) {
    const queueRepository = dataSource.getRepository(queue_item_entity_1.QueueItem);
    const appointmentRepository = dataSource.getRepository(appointment_entity_1.Appointment);
    const doctorRepository = dataSource.getRepository(doctor_entity_1.Doctor);
    console.log('🌱 Seeding completed patients data...');
    const doctors = await doctorRepository.find({ where: { isActive: true } });
    if (doctors.length === 0) {
        console.log('❌ No active doctors found. Please seed doctors first.');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedQueueItems = [];
    for (let i = 1; i <= 15; i++) {
        const doctor = doctors[i % doctors.length];
        const createdTime = new Date(todayStart.getTime() + (i * 30 * 60 * 1000));
        const consultationStarted = new Date(createdTime.getTime() + (20 * 60 * 1000));
        const consultationEnded = new Date(consultationStarted.getTime() + (15 * 60 * 1000));
        const queueItem = queueRepository.create({
            queueNumber: i,
            queueDate: today,
            patientName: `Patient ${i}`,
            patientPhone: `+1234567${String(i).padStart(3, '0')}`,
            patientAge: 25 + (i % 50),
            status: queue_item_entity_1.QueueStatus.COMPLETED,
            priority: i % 4 === 0 ? queue_item_entity_1.QueuePriority.HIGH : queue_item_entity_1.QueuePriority.NORMAL,
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
            status: appointment_entity_1.AppointmentStatus.COMPLETED,
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
        await queueRepository.save(completedQueueItems);
        console.log(`✅ Created ${completedQueueItems.length} completed queue items for today`);
        await appointmentRepository.save(completedAppointments);
        console.log(`✅ Created ${completedAppointments.length} completed appointments for today`);
        console.log('🎉 Completed data seeding finished successfully!');
        console.log(`📊 Total completed today: ${completedQueueItems.length + completedAppointments.length}`);
    }
    catch (error) {
        console.error('❌ Error seeding completed data:', error);
        throw error;
    }
}
//# sourceMappingURL=seed-completed-data.js.map
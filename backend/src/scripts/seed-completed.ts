import { DataSource } from 'typeorm';
import { seedCompletedData } from '../database/seed-completed-data';
import { QueueItem } from '../entities/queue-item.entity';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { User } from '../entities/user.entity';

async function runSeed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'clinic_db',
    entities: [User, Doctor, Appointment, QueueItem],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    await seedCompletedData(dataSource);

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

runSeed();

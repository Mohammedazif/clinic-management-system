import { DataSource } from 'typeorm'
import { User } from './entities/User'
import { Doctor } from './entities/Doctor'
import { Appointment } from './entities/Appointment'
import { QueueItem } from './entities/QueueItem'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clinic_db',
  synchronize: process.env.NODE_ENV === 'development', // Auto-create tables in development
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Doctor, Appointment, QueueItem],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
})

let isInitialized = false

export async function initializeDatabase() {
  if (!isInitialized) {
    try {
      await AppDataSource.initialize()
      console.log('Database connection established successfully')
      isInitialized = true
    } catch (error) {
      console.error('Error during database initialization:', error)
      throw error
    }
  }
  return AppDataSource
}

export async function getDatabase() {
  if (!isInitialized) {
    await initializeDatabase()
  }
  return AppDataSource
}

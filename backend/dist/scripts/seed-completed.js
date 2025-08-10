"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const seed_completed_data_1 = require("../database/seed-completed-data");
const queue_item_entity_1 = require("../entities/queue-item.entity");
const appointment_entity_1 = require("../entities/appointment.entity");
const doctor_entity_1 = require("../entities/doctor.entity");
const user_entity_1 = require("../entities/user.entity");
async function runSeed() {
    const dataSource = new typeorm_1.DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'clinic_db',
        entities: [user_entity_1.User, doctor_entity_1.Doctor, appointment_entity_1.Appointment, queue_item_entity_1.QueueItem],
        synchronize: false,
    });
    try {
        await dataSource.initialize();
        console.log('📦 Database connection established');
        await (0, seed_completed_data_1.seedCompletedData)(dataSource);
        console.log('✅ Seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
    }
    finally {
        await dataSource.destroy();
        console.log('🔌 Database connection closed');
    }
}
runSeed();
//# sourceMappingURL=seed-completed.js.map
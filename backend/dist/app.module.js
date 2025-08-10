"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const logging_middleware_1 = require("./middleware/logging.middleware");
const user_entity_1 = require("./entities/user.entity");
const doctor_entity_1 = require("./entities/doctor.entity");
const appointment_entity_1 = require("./entities/appointment.entity");
const queue_item_entity_1 = require("./entities/queue-item.entity");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const doctors_module_1 = require("./doctors/doctors.module");
const appointments_module_1 = require("./appointments/appointments.module");
const queue_module_1 = require("./queue/queue.module");
const health_controller_1 = require("./health/health.controller");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(logging_middleware_1.LoggingMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                username: process.env.DB_USERNAME || 'root',
                password: process.env.DB_PASSWORD || 'password',
                database: process.env.DB_DATABASE || 'clinic_frontend_db',
                entities: [user_entity_1.User, doctor_entity_1.Doctor, appointment_entity_1.Appointment, queue_item_entity_1.QueueItem],
                synchronize: process.env.NODE_ENV === 'development',
                logging: process.env.NODE_ENV === 'development',
                autoLoadEntities: true,
            }),
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
                signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
            }),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            doctors_module_1.DoctorsModule,
            appointments_module_1.AppointmentsModule,
            queue_module_1.QueueModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
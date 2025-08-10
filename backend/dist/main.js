"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await app.listen(port, host);
    console.log(`🚀 Clinic Backend Server running on http://${host}:${port}`);
    console.log(`📊 Database: ${process.env.DATABASE_NAME || process.env.DB_DATABASE}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
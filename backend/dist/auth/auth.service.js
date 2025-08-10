"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../entities/user.entity");
let AuthService = class AuthService {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async register(createUserDto) {
        const { username, email, password, firstName, lastName, role, phone } = createUserDto;
        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }],
        });
        if (existingUser) {
            throw new common_1.ConflictException('Username or email already exists');
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = this.userRepository.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role || user_entity_1.UserRole.FRONT_DESK,
            phone,
        });
        const savedUser = await this.userRepository.save(user);
        const token = this.generateToken(savedUser);
        const { password: _, ...userWithoutPassword } = savedUser;
        return {
            user: userWithoutPassword,
            token,
        };
    }
    async login(loginDto) {
        const { username, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: [{ username }, { email: username }],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        user.lastLogin = new Date();
        await this.userRepository.save(user);
        const token = this.generateToken(user);
        console.log('Generated JWT token:', token ? 'Token created successfully' : 'Token generation failed');
        const { password: _, ...userWithoutPassword } = user;
        const response = {
            user: userWithoutPassword,
            token,
        };
        console.log('Login response structure:', { hasUser: !!response.user, hasToken: !!response.token });
        return response;
    }
    async validateUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true },
        });
        if (!user) {
            return null;
        }
        return user;
    }
    async getUserProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid current password');
        }
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedNewPassword;
        await this.userRepository.save(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
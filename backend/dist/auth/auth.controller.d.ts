import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        user: Partial<import("../entities/user.entity").User>;
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: Partial<import("../entities/user.entity").User>;
        token: string;
    }>;
    getProfile(req: any): Promise<Partial<import("../entities/user.entity").User>>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}

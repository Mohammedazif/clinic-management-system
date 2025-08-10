import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    updateProfile(id: string, updateData: Partial<User>): Promise<User>;
    deactivateUser(id: string): Promise<void>;
    activateUser(id: string): Promise<void>;
}

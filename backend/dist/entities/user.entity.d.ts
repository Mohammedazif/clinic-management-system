export declare enum UserRole {
    ADMIN = "admin",
    FRONT_DESK = "front_desk",
    DOCTOR = "doctor"
}
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone: string;
    isActive: boolean;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
    get fullName(): string;
}

import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RestrictedUsersRepository } from './users.repository';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: RestrictedUsersRepository);
    findById(userId: string): Promise<import("./entities/user.entity").User>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<import("./entities/user.entity").User>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    updateByAdmin(userId: string, dto: AdminUpdateUserDto): Promise<import("./entities/user.entity").User>;
}

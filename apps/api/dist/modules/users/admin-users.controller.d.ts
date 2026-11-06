import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UsersService } from './users.service';
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    update(id: string, dto: AdminUpdateUserDto): Promise<import("./entities/user.entity").User>;
}

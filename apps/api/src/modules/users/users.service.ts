import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RestrictedUsersRepository } from './users.repository';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: RestrictedUsersRepository,
    ) { }

    async findById(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.findById(userId);

        Object.assign(user, dto);
        return this.userRepository.save(user);
    }

    async findAll() {
        return this.userRepository.find({ order: { createdAt: 'DESC' } });
    }

    async updateByAdmin(userId: string, dto: AdminUpdateUserDto) {
        const user = await this.findById(userId);
        Object.assign(user, dto);
        return this.userRepository.save(user);
    }
}

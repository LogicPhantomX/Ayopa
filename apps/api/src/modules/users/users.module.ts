import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './admin-users.controller';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RestrictedUsersRepository } from './users.repository';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UsersController, AdminUsersController],
    providers: [UsersService, RestrictedUsersRepository],
    exports: [UsersService, RestrictedUsersRepository],
})
export class UsersModule { }

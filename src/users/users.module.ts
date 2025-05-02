import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { IUserRepository } from './user.repository.interface';
import { MySQLUserRepository } from './mysql-user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: IUserRepository,
      useClass: MySQLUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}

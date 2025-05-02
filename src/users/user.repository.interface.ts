import { User, SafeUser } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(createUserDto: CreateUserDto): Promise<SafeUser>;
  update(
    id: number,
    updateUserDto: Partial<UpdateUserDto>,
    currentEmail?: string,
  ): Promise<SafeUser | null>;
  remove(id: number): Promise<boolean>;
  findAll(): Promise<SafeUser[]>;
}

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IUserRepository } from './user.repository.interface';
import { User, SafeUser } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async findOneByEmailForAuth(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    return user;
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    delete user.passwordHash;
    return user;
  }

  async findAll(): Promise<SafeUser[]> {
    return this.userRepository.findAll();
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    return this.userRepository.create(createUserDto);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    requestingUserId: number,
  ): Promise<SafeUser> {
    if (id !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to update this user.',
      );
    }

    const currentUser = await this.userRepository.findById(id);
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const updatedUser = await this.userRepository.update(
      id,
      updateUserDto,
      currentUser.email,
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} could not be updated.`);
    }
    return updatedUser;
  }

  async remove(id: number, requestingUserId: number): Promise<void> {
    if (id !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to delete this user.',
      );
    }

    const userExists = await this.userRepository.findById(id);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const wasDeleted = await this.userRepository.remove(id);
    if (!wasDeleted) {
      throw new InternalServerErrorException(
        `Failed to delete user with ID ${id}.`,
      );
    }
  }
}

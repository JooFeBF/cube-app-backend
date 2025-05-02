import {
  Injectable,
  Inject,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { DATABASE_POOL } from '../database/database.providers';
import { IUserRepository } from './user.repository.interface';
import { User, SafeUser } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MySQLUserRepository implements IUserRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToUser(row: RowDataPacket | undefined): User | null {
    if (!row) return null;
    const user = new User();
    user.userId = row.user_id;
    user.userName = row.user_name;
    user.email = row.email;
    user.passwordHash = row.password_hash;
    user.registrationDate = row.registration_date;
    return user;
  }

  private mapRowToSafeUser(row: RowDataPacket | undefined): SafeUser | null {
    const user = this.mapRowToUser(row);
    if (user) {
      delete user.passwordHash;
    }
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [id]);
      return this.mapRowToUser(rows[0]);
    } catch (error) {
      console.error(`Error finding user by ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Database query failed finding user by ID.',
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [email]);
      return this.mapRowToUser(rows[0]);
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw new InternalServerErrorException(
        'Database query failed finding user by email.',
      );
    }
  }

  async findAll(): Promise<SafeUser[]> {
    const query =
      'SELECT user_id, user_name, email, registration_date FROM users ORDER BY user_name';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query);

      return rows.map((row) => ({
        userId: row.user_id,
        userName: row.user_name,
        email: row.email,
        registrationDate: row.registration_date,
      }));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new InternalServerErrorException(
        'Database query failed finding all users.',
      );
    }
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      throw new InternalServerErrorException(
        'Error processing registration data.',
      );
    }

    const query = `INSERT INTO users (user_name, email, password_hash) VALUES (?, ?, ?)`;
    const values = [
      createUserDto.userName,
      createUserDto.email,
      hashedPassword,
    ];

    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, values);
      const insertedId = result.insertId;

      const newUser = await this.findById(insertedId);
      if (!newUser) {
        throw new InternalServerErrorException(
          'Failed to retrieve newly created user.',
        );
      }
      delete newUser.passwordHash;
      return newUser;
    } catch (error) {
      console.error('Error creating user in DB:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `Email ${createUserDto.email} already exists.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error during user creation.',
      );
    }
  }

  async update(
    id: number,
    updateUserDto: Partial<UpdateUserDto>,
    currentEmail?: string,
  ): Promise<SafeUser | null> {
    const fieldsToUpdate: string[] = [];
    const values: (string | number)[] = [];

    if (updateUserDto.userName) {
      fieldsToUpdate.push('user_name = ?');
      values.push(updateUserDto.userName);
    }

    if (updateUserDto.email && updateUserDto.email !== currentEmail) {
      fieldsToUpdate.push('email = ?');
      values.push(updateUserDto.email);
    }
    if (updateUserDto.password) {
      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(
          updateUserDto.password,
          saltRounds,
        );
        fieldsToUpdate.push('password_hash = ?');
        values.push(hashedPassword);
      } catch (hashError) {
        console.error('Error hashing new password during update:', hashError);
        throw new InternalServerErrorException(
          'Error processing password update.',
        );
      }
    }

    if (fieldsToUpdate.length === 0) {
      const currentUser = await this.findById(id);
      if (currentUser) delete currentUser.passwordHash;
      return currentUser;
    }

    values.push(id);

    const query = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`;

    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, values);

      if (result.affectedRows === 0) {
        return null;
      }

      const updatedUser = await this.findById(id);
      if (updatedUser) delete updatedUser.passwordHash;
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ID ${id}:`, error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `Email ${updateUserDto.email} already exists.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error during user update.',
      );
    }
  }

  async remove(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE user_id = ?';
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting user ID ${id}:`, error);

      throw new InternalServerErrorException(
        'Database error during user deletion.',
      );
    }
  }
}

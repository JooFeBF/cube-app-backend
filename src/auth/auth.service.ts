import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findOneByEmailForAuth(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials (user)');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials (password)');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(
    user: Omit<User, 'passwordHash'>,
  ): Promise<{ access_token: string }> {
    const payload = { username: user.userName, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    return this.authService.login(user);
  }
}

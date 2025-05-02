import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SafeUser } from './entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<SafeUser> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest): Promise<SafeUser> {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<SafeUser[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<SafeUser> {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SafeUser> {
    return this.usersService.update(id, updateUserDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.usersService.remove(id, req.user.userId);
  }
}

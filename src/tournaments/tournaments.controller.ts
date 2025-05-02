import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../users/users.controller';
import { Tournament } from './entities/tournament.entity';
import { Registration } from './entities/registration.entity';
import { TournamentAdmin } from './entities/tournament-admin.entity';
import { Scramble } from 'src/scrambles/entities/scramble.entity';
import { ScramblesService } from 'src/scrambles/scrambles.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly scramblesService: ScramblesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Tournament> {
    return this.tournamentsService.create(createTournamentDto, req.user.userId);
  }

  @Get()
  async findAll(): Promise<Tournament[]> {
    return this.tournamentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tournament> {
    return this.tournamentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Tournament> {
    return this.tournamentsService.update(
      id,
      updateTournamentDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.tournamentsService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/registrations')
  async register(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Registration> {
    return this.tournamentsService.registerUser(tournamentId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/registrations')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.tournamentsService.unregisterUser(tournamentId, req.user.userId);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard)
  async getRegistrations(
    @Param('id', ParseIntPipe) tournamentId: number,
  ): Promise<number[]> {
    return this.tournamentsService.getRegistrations(tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/admins')
  async addAdmin(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Body('userId', ParseIntPipe) userIdToAdd: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<TournamentAdmin> {
    return this.tournamentsService.addAdmin(
      tournamentId,
      userIdToAdd,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/admins/:userIdToRemove')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAdmin(
    @Param('id', ParseIntPipe) tournamentId: number,
    @Param('userIdToRemove', ParseIntPipe) userIdToRemove: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.tournamentsService.removeAdmin(
      tournamentId,
      userIdToRemove,
      req.user.userId,
    );
  }

  @Get(':id/admins')
  @UseGuards(JwtAuthGuard)
  async getAdmins(
    @Param('id', ParseIntPipe) tournamentId: number,
  ): Promise<number[]> {
    return this.tournamentsService.getAdmins(tournamentId);
  }

  @Get(':id/scrambles')
  @UseGuards(JwtAuthGuard)
  async getScrambles(
    @Param('id', ParseIntPipe) tournamentId: number,
  ): Promise<Scramble[]> {
    return this.tournamentsService.getScramblesForTournament(tournamentId);
  }
}

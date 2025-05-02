import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { DATABASE_POOL } from '../database/database.providers';
import { ITournamentRepository } from './tournament.repository.interface';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament, TournamentStatus } from './entities/tournament.entity';
import { IScrambleRepository } from '../scrambles/scramble.repository.interface';
import { ScramblesService } from '../scrambles/scrambles.service';
import { Registration } from './entities/registration.entity';
import { TournamentAdmin } from './entities/tournament-admin.entity';
import { Scramble } from 'src/scrambles/entities/scramble.entity';

@Injectable()
export class TournamentsService {
  constructor(
    @Inject(DATABASE_POOL) private pool: Pool,
    @Inject(ITournamentRepository)
    private readonly tournamentRepository: ITournamentRepository,

    @Inject(IScrambleRepository)
    private readonly scrambleRepository: IScrambleRepository,
    private readonly scramblesService: ScramblesService,
  ) {}

  async create(
    dto: CreateTournamentDto,
    creatorId: number,
  ): Promise<Tournament> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const tournament = await this.tournamentRepository.create(
        dto,
        creatorId,
        connection,
      );

      await this.tournamentRepository.addAdmin(
        tournament.tournamentId,
        creatorId,
        connection,
      );

      const scrambleSequences = await this.scramblesService.generateScrambles(
        tournament.modalityId,
        5,
      );
      const scrambleData = scrambleSequences.map((seq, index) => ({
        tournamentId: tournament.tournamentId,
        roundNumber: index + 1,
        scrambleSequence: seq,
      }));
      await this.scrambleRepository.createMany(scrambleData, connection);

      await connection.commit();
      return tournament;
    } catch (error) {
      await connection.rollback();
      console.error('Transaction failed during tournament creation:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create tournament due to transaction error.',
      );
    } finally {
      connection.release();
    }
  }

  async findAll(): Promise<Tournament[]> {
    return this.tournamentRepository.findAll();
  }

  async findOne(id: number): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found.`);
    }

    return tournament;
  }

  async update(
    id: number,
    dto: UpdateTournamentDto,
    requestingUserId: number,
  ): Promise<Tournament> {
    const isAdmin = await this.tournamentRepository.isUserAdmin(
      id,
      requestingUserId,
    );
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only tournament admins can update the tournament.',
      );
    }

    const updatedTournament = await this.tournamentRepository.update(id, dto);
    if (!updatedTournament) {
      throw new NotFoundException(
        `Tournament with ID ${id} not found for update.`,
      );
    }
    return updatedTournament;
  }

  async remove(id: number, requestingUserId: number): Promise<void> {
    const isAdmin = await this.tournamentRepository.isUserAdmin(
      id,
      requestingUserId,
    );

    const tournament = await this.findOne(id);
    if (requestingUserId !== tournament.creatorId && !isAdmin) {
      throw new ForbiddenException(
        'Only the creator or an admin can delete the tournament.',
      );
    }

    const deleted = await this.tournamentRepository.remove(id);
    if (!deleted) {
      throw new NotFoundException(
        `Tournament with ID ${id} not found for deletion.`,
      );
    }
  }

  async registerUser(
    tournamentId: number,
    userId: number,
  ): Promise<Registration> {
    const tournament = await this.findOne(tournamentId);
    if (
      tournament.status !==
      TournamentStatus.PLANNED /* && tournament.status !== TournamentStatus.ONGOING */
    ) {
      throw new BadRequestException(
        `Tournament is not open for registration (status: ${tournament.status}).`,
      );
    }

    return this.tournamentRepository.registerUser(tournamentId, userId);
  }

  async unregisterUser(tournamentId: number, userId: number): Promise<void> {
    const registration = await this.tournamentRepository.findUserRegistration(
      tournamentId,
      userId,
    );
    if (!registration) {
      throw new NotFoundException(
        `User ${userId} is not registered for tournament ${tournamentId}.`,
      );
    }

    const deleted = await this.tournamentRepository.unregisterUser(
      tournamentId,
      userId,
    );
    if (!deleted) {
      throw new InternalServerErrorException('Failed to unregister user.');
    }
  }

  async getRegistrations(tournamentId: number): Promise<number[]> {
    await this.findOne(tournamentId);
    return this.tournamentRepository.findTournamentRegistrationsIds(
      tournamentId,
    );
  }

  async addAdmin(
    tournamentId: number,
    userIdToAdd: number,
    requestingUserId: number,
  ): Promise<TournamentAdmin> {
    const isAdmin = await this.tournamentRepository.isUserAdmin(
      tournamentId,
      requestingUserId,
    );
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only tournament admins can add other admins.',
      );
    }

    return this.tournamentRepository.addAdmin(tournamentId, userIdToAdd);
  }

  async removeAdmin(
    tournamentId: number,
    userIdToRemove: number,
    requestingUserId: number,
  ): Promise<void> {
    const isAdmin = await this.tournamentRepository.isUserAdmin(
      tournamentId,
      requestingUserId,
    );
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only tournament admins can remove other admins.',
      );
    }

    const tournament = await this.findOne(tournamentId);
    if (userIdToRemove === tournament.creatorId) {
      throw new ForbiddenException(
        'Cannot remove the tournament creator from admins.',
      );
    }

    const deleted = await this.tournamentRepository.removeAdmin(
      tournamentId,
      userIdToRemove,
    );
    if (!deleted) {
      throw new NotFoundException(
        `User ${userIdToRemove} is not an admin for tournament ${tournamentId}.`,
      );
    }
  }

  async getAdmins(tournamentId: number): Promise<number[]> {
    await this.findOne(tournamentId);
    return this.tournamentRepository.findTournamentAdminsIds(tournamentId);
  }

  async getScramblesForTournament(tournamentId: number): Promise<Scramble[]> {
    await this.findOne(tournamentId);

    return this.scramblesService.getScramblesByTournamentId(tournamentId);
  }
}

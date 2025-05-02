import { Tournament } from './entities/tournament.entity';
import { TournamentAdmin } from './entities/tournament-admin.entity';
import { Registration } from './entities/registration.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { PoolConnection } from 'mysql2/promise';

export const ITournamentRepository = Symbol('ITournamentRepository');

export interface ITournamentRepository {
  create(
    dto: CreateTournamentDto,
    creatorId: number,
    connection?: PoolConnection,
  ): Promise<Tournament>;
  findById(id: number): Promise<Tournament | null>;
  findAll(): Promise<Tournament[]>;
  update(
    id: number,
    dto: Partial<UpdateTournamentDto>,
    connection?: PoolConnection,
  ): Promise<Tournament | null>;
  remove(id: number, connection?: PoolConnection): Promise<boolean>;

  addAdmin(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<TournamentAdmin>;
  removeAdmin(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<boolean>;
  findTournamentAdminsIds(tournamentId: number): Promise<number[]>;
  isUserAdmin(tournamentId: number, userId: number): Promise<boolean>;

  registerUser(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<Registration>;
  unregisterUser(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<boolean>;
  findUserRegistration(
    tournamentId: number,
    userId: number,
  ): Promise<Registration | null>;
  findTournamentRegistrationsIds(tournamentId: number): Promise<number[]>;
}

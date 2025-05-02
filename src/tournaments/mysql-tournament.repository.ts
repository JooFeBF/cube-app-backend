import {
  Injectable,
  Inject,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Pool,
  RowDataPacket,
  ResultSetHeader,
  PoolConnection,
} from 'mysql2/promise';
import { DATABASE_POOL } from '../database/database.providers';
import { ITournamentRepository } from './tournament.repository.interface';
import { Tournament, TournamentStatus } from './entities/tournament.entity';
import { TournamentAdmin } from './entities/tournament-admin.entity';
import { Registration } from './entities/registration.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class MySQLTournamentRepository implements ITournamentRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToTournament(
    row: RowDataPacket | undefined,
  ): Tournament | null {
    if (!row) return null;
    const tournament = new Tournament();
    tournament.tournamentId = row.tournament_id;
    tournament.tournamentName = row.tournament_name;
    tournament.startDateTime = row.start_datetime;
    tournament.status = row.status as TournamentStatus;
    tournament.creatorId = row.creator_id;
    tournament.modalityId = row.modality_id;

    return tournament;
  }

  async create(
    dto: CreateTournamentDto,
    creatorId: number,
    connection?: PoolConnection,
  ): Promise<Tournament> {
    const conn = connection || this.pool;
    const query = `INSERT INTO tournaments (tournament_name, start_datetime, status, creator_id, modality_id) VALUES (?, ?, ?, ?, ?)`;
    const values = [
      dto.tournamentName,
      dto.startDateTime,
      TournamentStatus.PLANNED,
      creatorId,
      dto.modalityId,
    ];
    try {
      const [result] = await conn.execute<ResultSetHeader>(query, values);
      const tournamentId = result.insertId;

      return {
        tournamentId: tournamentId,
        tournamentName: dto.tournamentName,
        startDateTime: new Date(dto.startDateTime),
        status: TournamentStatus.PLANNED,
        creatorId: creatorId,
        modalityId: dto.modalityId,
      };
    } catch (error) {
      console.error('Error creating tournament:', error);
      if (
        error.code === 'ER_NO_REFERENCED_ROW_2' &&
        error.message.includes('modality_id')
      ) {
        throw new NotFoundException(
          `Modality with ID ${dto.modalityId} not found.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error creating tournament.',
      );
    }
  }

  async findById(id: number): Promise<Tournament | null> {
    const query = 'SELECT * FROM tournaments WHERE tournament_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [id]);
      return this.mapRowToTournament(rows[0]);
    } catch (error) {
      console.error(`Error finding tournament by ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Database error finding tournament.',
      );
    }
  }

  async findAll(): Promise<Tournament[]> {
    const query = 'SELECT * FROM tournaments ORDER BY start_datetime DESC';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query);
      return rows
        .map((row) => this.mapRowToTournament(row))
        .filter((t) => t !== null) as Tournament[];
    } catch (error) {
      console.error('Error finding all tournaments:', error);
      throw new InternalServerErrorException(
        'Database error finding all tournaments.',
      );
    }
  }

  async update(
    id: number,
    dto: Partial<UpdateTournamentDto>,
    connection?: PoolConnection,
  ): Promise<Tournament | null> {
    const conn = connection || this.pool;
    const fieldsToUpdate: string[] = [];
    const values: (string | number | Date)[] = [];

    if (dto.tournamentName) {
      fieldsToUpdate.push('tournament_name = ?');
      values.push(dto.tournamentName);
    }
    if (dto.startDateTime) {
      fieldsToUpdate.push('start_datetime = ?');
      values.push(dto.startDateTime);
    }
    if (dto.status) {
      fieldsToUpdate.push('status = ?');
      values.push(dto.status);
    }

    if (fieldsToUpdate.length === 0) {
      return this.findById(id);
    }
    values.push(id);

    const query = `UPDATE tournaments SET ${fieldsToUpdate.join(', ')} WHERE tournament_id = ?`;
    try {
      const [result] = await conn.execute<ResultSetHeader>(query, values);
      if (result.affectedRows === 0) {
        return null;
      }
      return this.findById(id);
    } catch (error) {
      console.error(`Error updating tournament ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Database error updating tournament.',
      );
    }
  }

  async remove(id: number, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || this.pool;
    const query = 'DELETE FROM tournaments WHERE tournament_id = ?';
    try {
      const [result] = await conn.execute<ResultSetHeader>(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting tournament ID ${id}:`, error);

      throw new InternalServerErrorException(
        'Database error deleting tournament.',
      );
    }
  }

  async addAdmin(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<TournamentAdmin> {
    const conn = connection || this.pool;
    const query =
      'INSERT INTO tournament_admins (tournament_id, user_id) VALUES (?, ?)';
    try {
      await conn.execute(query, [tournamentId, userId]);
      return { tournamentId, userId };
    } catch (error) {
      console.error(
        `Error adding admin ${userId} to tournament ${tournamentId}:`,
        error,
      );
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `User ${userId} is already an admin for tournament ${tournamentId}.`,
        );
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new NotFoundException(
          `Tournament ${tournamentId} or User ${userId} not found.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error adding tournament admin.',
      );
    }
  }

  async removeAdmin(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const conn = connection || this.pool;
    const query =
      'DELETE FROM tournament_admins WHERE tournament_id = ? AND user_id = ?';
    try {
      const [result] = await conn.execute<ResultSetHeader>(query, [
        tournamentId,
        userId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(
        `Error removing admin ${userId} from tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error removing tournament admin.',
      );
    }
  }

  async findTournamentAdminsIds(tournamentId: number): Promise<number[]> {
    const query =
      'SELECT user_id FROM tournament_admins WHERE tournament_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        tournamentId,
      ]);
      return rows.map((row) => row.user_id as number);
    } catch (error) {
      console.error(
        `Error finding admins for tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding tournament admins.',
      );
    }
  }

  async isUserAdmin(tournamentId: number, userId: number): Promise<boolean> {
    const query =
      'SELECT 1 FROM tournament_admins WHERE tournament_id = ? AND user_id = ? LIMIT 1';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        tournamentId,
        userId,
      ]);
      return rows.length > 0;
    } catch (error) {
      console.error(
        `Error checking if user ${userId} is admin for tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error checking admin status.',
      );
    }
  }

  async registerUser(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<Registration> {
    const conn = connection || this.pool;
    const query =
      'INSERT INTO registrations (tournament_id, user_id) VALUES (?, ?)';
    try {
      const [result] = await conn.execute<ResultSetHeader>(query, [
        tournamentId,
        userId,
      ]);

      const registration: Registration = {
        registrationId: result.insertId,
        tournamentId: tournamentId,
        userId: userId,
        registrationDate: new Date(),
      };
      return registration;
    } catch (error) {
      console.error(
        `Error registering user ${userId} for tournament ${tournamentId}:`,
        error,
      );
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `User ${userId} is already registered for tournament ${tournamentId}.`,
        );
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new NotFoundException(
          `Tournament ${tournamentId} or User ${userId} not found.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error registering user.',
      );
    }
  }

  async unregisterUser(
    tournamentId: number,
    userId: number,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const conn = connection || this.pool;
    const query =
      'DELETE FROM registrations WHERE tournament_id = ? AND user_id = ?';
    try {
      const [result] = await conn.execute<ResultSetHeader>(query, [
        tournamentId,
        userId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(
        `Error unregistering user ${userId} from tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error unregistering user.',
      );
    }
  }

  async findUserRegistration(
    tournamentId: number,
    userId: number,
  ): Promise<Registration | null> {
    const query =
      'SELECT * FROM registrations WHERE tournament_id = ? AND user_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        tournamentId,
        userId,
      ]);
      if (rows.length === 0) return null;
      const row = rows[0];
      const registration: Registration = {
        registrationId: row.registration_id,
        tournamentId: row.tournament_id,
        userId: row.user_id,
        registrationDate: row.registration_date,
      };
      return registration;
    } catch (error) {
      console.error(
        `Error finding registration for user ${userId}, tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding registration.',
      );
    }
  }

  async findTournamentRegistrationsIds(
    tournamentId: number,
  ): Promise<number[]> {
    const query = 'SELECT user_id FROM registrations WHERE tournament_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        tournamentId,
      ]);
      return rows.map((row) => row.user_id as number);
    } catch (error) {
      console.error(
        `Error finding registrations for tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding tournament registrations.',
      );
    }
  }
}

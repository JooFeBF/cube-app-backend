import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Pool, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { DATABASE_POOL } from '../database/database.providers';
import {
  IScrambleRepository,
  CreateScrambleData,
} from './scramble.repository.interface';
import { Scramble } from './entities/scramble.entity';

@Injectable()
export class MySQLScrambleRepository implements IScrambleRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToScramble(row: RowDataPacket | undefined): Scramble | null {
    if (!row) return null;
    const scramble = new Scramble();
    scramble.scrambleId = row.scramble_id;
    scramble.tournamentId = row.tournament_id;
    scramble.roundNumber = row.round_number;
    scramble.scrambleSequence = row.scramble_sequence;
    return scramble;
  }

  async createMany(
    scrambles: CreateScrambleData[],
    connection?: PoolConnection,
  ): Promise<boolean> {
    if (scrambles.length === 0) {
      return true;
    }

    const conn = connection || this.pool;

    const query = `INSERT INTO scrambles (tournament_id, round_number, scramble_sequence) VALUES ?`;

    const values = scrambles.map((s) => [
      s.tournamentId,
      s.roundNumber,
      s.scrambleSequence,
    ]);

    try {
      const [result] = await conn.query(query, [values]);

      return true;
    } catch (error) {
      console.error('Error creating multiple scrambles:', error);

      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new InternalServerErrorException(
          `Failed to create scrambles: Invalid tournament ID provided.`,
        );
      }
      if (error.code === 'ER_DUP_ENTRY') {
        throw new InternalServerErrorException(
          `Failed to create scrambles: Duplicate round number for the tournament.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error creating scrambles.',
      );
    }
  }

  async findByTournamentId(tournamentId: number): Promise<Scramble[]> {
    const query =
      'SELECT * FROM scrambles WHERE tournament_id = ? ORDER BY round_number ASC';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        tournamentId,
      ]);
      return rows
        .map((row) => this.mapRowToScramble(row))
        .filter((s) => s !== null) as Scramble[];
    } catch (error) {
      console.error(
        `Error finding scrambles for tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding scrambles.',
      );
    }
  }

  async findById(id: number): Promise<Scramble | null> {
    const query = 'SELECT * FROM scrambles WHERE scramble_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [id]);
      return this.mapRowToScramble(rows[0]); // Reusa el helper de mapeo
    } catch (error) {
      console.error(`Error finding scramble by ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Database error finding scramble by ID.',
      );
    }
  }
}

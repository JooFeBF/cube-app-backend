import {
  Injectable,
  Inject,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { DATABASE_POOL } from '../database/database.providers';
import {
  ISolutionRepository,
  CreateSolutionData,
} from './solution.repository.interface';
import { Solution, SolutionPenalty } from './entities/solution.entity';

@Injectable()
export class MySQLSolutionRepository implements ISolutionRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToSolution(row: RowDataPacket | undefined): Solution | null {
    if (!row) return null;
    const solution = new Solution();
    solution.solutionId = row.solution_id;
    solution.userId = row.user_id;
    solution.tournamentId = row.tournament_id;
    solution.scrambleId = row.scramble_id;
    solution.recordedTimeMs = row.recorded_time_ms;

    const penaltyValue = row.penalty as string;
    if (
      Object.values(SolutionPenalty).includes(penaltyValue as SolutionPenalty)
    ) {
      solution.penalty = penaltyValue as SolutionPenalty;
    } else {
      console.warn(`Invalid penalty value found in database: ${penaltyValue}`);

      solution.penalty = SolutionPenalty.DNF;
    }
    solution.recordDateTime = row.record_datetime;
    return solution;
  }

  async create(data: CreateSolutionData): Promise<Solution> {
    const query = `
            INSERT INTO solutions
                (user_id, tournament_id, scramble_id, recorded_time_ms, penalty)
            VALUES (?, ?, ?, ?, ?)
        `;
    const values = [
      data.userId,
      data.tournamentId,
      data.scrambleId,
      data.recordedTimeMs,
      data.penalty,
    ];

    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, values);
      const insertedId = result.insertId;

      const newSolution = await this.findById(insertedId);
      if (!newSolution) {
        throw new InternalServerErrorException(
          'Failed to retrieve newly created solution.',
        );
      }
      return newSolution;
    } catch (error) {
      console.error('Error creating solution:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `A solution already exists for user ${data.userId} and scramble ${data.scrambleId}.`,
        );
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException(
          `Invalid user, tournament, or scramble ID provided during solution creation.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error creating solution.',
      );
    }
  }

  async findById(id: number): Promise<Solution | null> {
    const query = 'SELECT * FROM solutions WHERE solution_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [id]);
      return this.mapRowToSolution(rows[0]);
    } catch (error) {
      console.error(`Error finding solution by ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Database error finding solution by ID.',
      );
    }
  }

  async findByTournament(tournamentId: number): Promise<Solution[]> {
    const query = `
            SELECT * FROM solutions
            WHERE tournament_id = ?
            ORDER BY user_id, record_datetime ASC
        `;
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        tournamentId,
      ]);
      return rows
        .map((row) => this.mapRowToSolution(row))
        .filter((s) => s !== null) as Solution[];
    } catch (error) {
      console.error(
        `Error finding solutions for tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding solutions for tournament.',
      );
    }
  }

  async findByUserAndTournament(
    userId: number,
    tournamentId: number,
  ): Promise<Solution[]> {
    const query = `
            SELECT s.* FROM solutions s
            JOIN scrambles scr ON s.scramble_id = scr.scramble_id
            WHERE s.user_id = ? AND s.tournament_id = ?
            ORDER BY scr.round_number ASC
        `;
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        userId,
        tournamentId,
      ]);
      return rows
        .map((row) => this.mapRowToSolution(row))
        .filter((s) => s !== null) as Solution[];
    } catch (error) {
      console.error(
        `Error finding solutions for user ${userId}, tournament ${tournamentId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding user solutions for tournament.',
      );
    }
  }

  async findByUserAndScramble(
    userId: number,
    scrambleId: number,
  ): Promise<Solution | null> {
    const query =
      'SELECT * FROM solutions WHERE user_id = ? AND scramble_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        userId,
        scrambleId,
      ]);
      return this.mapRowToSolution(rows[0]);
    } catch (error) {
      console.error(
        `Error finding solution for user ${userId}, scramble ${scrambleId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Database error finding specific solution.',
      );
    }
  }

  async update(
    solutionId: number,
    recordedTimeMs: number,
    penalty: SolutionPenalty,
  ): Promise<Solution> {
    const query = `
            UPDATE solutions
            SET recorded_time_ms = ?, penalty = ?
            WHERE solution_id = ?
        `;
    const values = [recordedTimeMs, penalty, solutionId];

    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, values);
      if (result.affectedRows === 0) {
        throw new InternalServerErrorException(
          `No solution found with ID ${solutionId}.`,
        );
      }
      return this.findById(solutionId);
    } catch (error) {
      console.error(`Error updating solution ${solutionId}:`, error);
      throw new InternalServerErrorException(
        'Database error updating solution.',
      );
    }
  }
}

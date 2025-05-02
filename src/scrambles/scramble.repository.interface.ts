import { Scramble } from './entities/scramble.entity';
import { PoolConnection } from 'mysql2/promise';

export interface CreateScrambleData {
  tournamentId: number;
  roundNumber: number;
  scrambleSequence: string;
}

export const IScrambleRepository = Symbol('IScrambleRepository');

export interface IScrambleRepository {
  createMany(
    scrambles: CreateScrambleData[],
    connection?: PoolConnection,
  ): Promise<boolean>;

  findById(id: number): Promise<Scramble | null>;

  findByTournamentId(tournamentId: number): Promise<Scramble[]>;
}

import { Solution, SolutionPenalty } from './entities/solution.entity';

export interface CreateSolutionData {
  userId: number;
  tournamentId: number;
  scrambleId: number;
  recordedTimeMs: number;
  penalty: SolutionPenalty;
}

export const ISolutionRepository = Symbol('ISolutionRepository');

export interface ISolutionRepository {
  create(data: CreateSolutionData): Promise<Solution>;
  findById(id: number): Promise<Solution | null>; // Añadido para poder recuperar tras crear
  findByTournament(tournamentId: number): Promise<Solution[]>;
  findByUserAndTournament(
    userId: number,
    tournamentId: number,
  ): Promise<Solution[]>;
  findByUserAndScramble(
    userId: number,
    scrambleId: number,
  ): Promise<Solution | null>;
  update(
    solutionId: number,
    recordedTimeMs: number,
    penalty: SolutionPenalty,
  ): Promise<Solution>;
}

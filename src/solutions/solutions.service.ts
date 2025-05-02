import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ISolutionRepository,
  CreateSolutionData,
} from './solution.repository.interface';
import { Solution, SolutionPenalty } from './entities/solution.entity';
import { CreateSolutionDto } from './entities/create-solution.dto';

import { IScrambleRepository } from '../scrambles/scramble.repository.interface';
import { ITournamentRepository } from '../tournaments/tournament.repository.interface';

@Injectable()
export class SolutionsService {
  constructor(
    @Inject(ISolutionRepository)
    private readonly solutionRepository: ISolutionRepository,

    @Inject(IScrambleRepository)
    private readonly scrambleRepository: IScrambleRepository,
    @Inject(ITournamentRepository)
    private readonly tournamentRepository: ITournamentRepository,
  ) {}

  async createSolution(
    dto: CreateSolutionDto,
    userId: number,
  ): Promise<Solution> {
    const scramble = await this.scrambleRepository.findById(dto.scrambleId);
    if (!scramble) {
      throw new NotFoundException(
        `Scramble with ID ${dto.scrambleId} not found.`,
      );
    }
    const { tournamentId } = scramble;

    const registration = await this.tournamentRepository.findUserRegistration(
      tournamentId,
      userId,
    );
    if (!registration) {
      throw new ForbiddenException(
        `User ${userId} is not registered for tournament ${tournamentId}.`,
      );
    }

    const existingSolution =
      await this.solutionRepository.findByUserAndScramble(
        userId,
        dto.scrambleId,
      );
    if (existingSolution) {
      throw new ConflictException(
        `Solution already submitted for user ${userId} and scramble ${dto.scrambleId}.`,
      );
    }

    const solutionData: CreateSolutionData = {
      userId: userId,
      tournamentId: tournamentId,
      scrambleId: dto.scrambleId,
      recordedTimeMs: dto.recordedTimeMs,
      penalty: dto.penalty,
    };

    try {
      return await this.solutionRepository.create(solutionData);
    } catch (error) {
      console.error(
        `Unexpected error creating solution for user ${userId}, scramble ${dto.scrambleId}:`,
        error,
      );
      throw new InternalServerErrorException('Could not record solution.');
    }
  }

  async findSolutionsByTournament(tournamentId: number): Promise<Solution[]> {
    const tournamentExists =
      await this.tournamentRepository.findById(tournamentId);
    if (!tournamentExists) {
      throw new NotFoundException(
        `Tournament with ID ${tournamentId} not found.`,
      );
    }
    return this.solutionRepository.findByTournament(tournamentId);
  }

  async findSolutionsByUserAndTournament(
    userId: number,
    tournamentId: number,
  ): Promise<Solution[]> {
    const registration = await this.tournamentRepository.findUserRegistration(
      tournamentId,
      userId,
    );
    if (!registration) {
      throw new NotFoundException(
        `No registration found for user ${userId} in tournament ${tournamentId}.`,
      );
    }
    return this.solutionRepository.findByUserAndTournament(
      userId,
      tournamentId,
    );
  }

  async updateSolution(
    solutionId: number,
    dto: CreateSolutionDto,
    userId: number,
  ): Promise<Solution> {
    try {
      const solution = await this.solutionRepository.findById(solutionId);
      if (!solution) {
        throw new NotFoundException(
          `Solution with ID ${solutionId} not found.`,
        );
      }

      const scramble = await this.scrambleRepository.findById(
        solution.scrambleId,
      );
      if (!scramble) {
        throw new NotFoundException(
          `Scramble with ID ${solution.scrambleId} not found.`,
        );
      }

      const registration = await this.tournamentRepository.findUserRegistration(
        scramble.tournamentId,
        userId,
      );
      if (!registration) {
        throw new ForbiddenException(
          `User ${userId} is not registered for tournament ${scramble.tournamentId}.`,
        );
      }

      return this.solutionRepository.update(
        solutionId,
        dto.recordedTimeMs,
        dto.penalty,
      );
    } catch (error) {
      console.error(
        `Error updating solution ${solutionId} for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Could not update solution.');
    }
  }

  calculateAo5(solutions: Solution[]): number | 'DNF' | null {
    if (solutions.length < 5) return null;

    const validTimes = solutions
      .map((s) => {
        if (s.penalty === SolutionPenalty.DNF) return Infinity;
        if (s.penalty === SolutionPenalty.PLUS_TWO)
          return s.recordedTimeMs + 2000;
        return s.recordedTimeMs;
      })
      .sort((a, b) => a - b);

    if (validTimes.filter((t) => t === Infinity).length > 1) {
      return 'DNF';
    }

    const middleTimes = validTimes.slice(1, 4);

    if (middleTimes.some((t) => t === Infinity)) {
      return 'DNF';
    }

    const sum = middleTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / 3);
  }

  calculateMo3(solutions: Solution[]): number | 'DNF' | null {
    if (solutions.length < 3) return null;

    const timesToAverage = solutions.slice(-3);

    const validTimes = timesToAverage.map((s) => {
      if (s.penalty === SolutionPenalty.DNF) return Infinity;
      if (s.penalty === SolutionPenalty.PLUS_TWO)
        return s.recordedTimeMs + 2000;
      return s.recordedTimeMs;
    });

    if (validTimes.some((t) => t === Infinity)) {
      return 'DNF';
    }

    const sum = validTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / 3);
  }
}

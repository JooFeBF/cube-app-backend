import {
  Injectable,
  Inject,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';
import {
  IScrambleRepository,
  CreateScrambleData,
} from './scramble.repository.interface';
import { Scramble } from './entities/scramble.entity';

import { Alg } from 'cubing/alg';

@Injectable()
export class ScramblesService {
  constructor(
    @Inject(IScrambleRepository)
    private readonly scrambleRepository: IScrambleRepository,
  ) {}

  async generateScrambles(
    modalityId: string,
    count: number,
  ): Promise<string[]> {
    let eventId: string;
    switch (modalityId.toLowerCase()) {
      case '3x3':
        eventId = '333';
        break;
      case '2x2':
        eventId = '222';
        break;
      case '4x4':
        eventId = '444';
        break;
      case '5x5':
        eventId = '555';
        break;
      case '6x6':
        eventId = '666';
        break;
      case '7x7':
        eventId = '777';
        break;
      case 'pyra':
        eventId = 'pyram';
        break;
      case 'mega':
        eventId = 'minx';
        break;
      case 'skewb':
        eventId = 'skewb';
        break;
      case 'sq1':
        eventId = 'sq1';
        break;
      case 'clock':
        eventId = 'clock';
        break;
      default:
        console.error(
          `Unsupported modality ID for cubing/scramble generation: ${modalityId}`,
        );
        throw new BadRequestException(
          `Scramble generation not supported for modality: ${modalityId}`,
        );
    }

    try {
      const cubingScrambleModule = await import('cubing/scramble');

      const randomScrambleForEvent =
        cubingScrambleModule.randomScrambleForEvent;

      const scramblePromises: Promise<string>[] = [];
      for (let i = 0; i < count; i++) {
        scramblePromises.push(
          randomScrambleForEvent(eventId).then((alg: Alg) => alg.toString()),
        );
      }

      const scrambles = await Promise.all(scramblePromises);
      return scrambles;
    } catch (error: unknown) {
      console.error(
        `Error generating scrambles dynamically for event ${eventId}:`,
        error,
      );

      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'ERR_MODULE_NOT_FOUND' ||
          error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED')
      ) {
        throw new InternalServerErrorException(
          `Failed to dynamically load 'cubing/scramble'. Check package installation, Node version, and tsconfig module settings.`,
        );
      }

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        `Failed to generate scrambles for modality ${modalityId}.`,
      );
    }
  }

  async createAndAssignScrambles(
    tournamentId: number,
    modalityId: string,
    scrambleCount: number,
    connection?: PoolConnection,
  ): Promise<boolean> {
    try {
      const sequences = await this.generateScrambles(modalityId, scrambleCount);

      const scrambleData: CreateScrambleData[] = sequences.map(
        (seq, index) => ({
          tournamentId: tournamentId,
          roundNumber: index + 1,
          scrambleSequence: seq,
        }),
      );

      return await this.scrambleRepository.createMany(scrambleData, connection);
    } catch (error) {
      console.error(
        `Failed to create and assign scrambles for tournament ${tournamentId}:`,
        error,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      if (
        error instanceof InternalServerErrorException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Could not assign scrambles to tournament ${tournamentId}.`,
      );
    }
  }

  async getScramblesByTournamentId(tournamentId: number): Promise<Scramble[]> {
    return this.scrambleRepository.findByTournamentId(tournamentId);
  }
}

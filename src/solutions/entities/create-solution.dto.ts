import { IsInt, IsPositive, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { SolutionPenalty } from '../entities/solution.entity';

export class CreateSolutionDto {
  @IsInt({ message: 'Scramble ID must be an integer.' })
  @IsPositive({ message: 'Scramble ID must be a positive number.' })
  @IsNotEmpty({ message: 'Scramble ID cannot be empty.' })
  scrambleId: number;

  @IsInt({ message: 'Recorded time must be an integer (milliseconds).' })
  @Min(0, { message: 'Recorded time cannot be negative.' })
  @IsNotEmpty({ message: 'Recorded time cannot be empty.' })
  recordedTimeMs: number;

  @IsEnum(SolutionPenalty, {
    message: 'Invalid penalty value. Must be OK, +2, or DNF.',
  })
  @IsNotEmpty({ message: 'Penalty cannot be empty.' })
  penalty: SolutionPenalty;
}

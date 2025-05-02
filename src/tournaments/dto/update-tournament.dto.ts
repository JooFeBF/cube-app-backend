import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TournamentStatus } from '../entities/tournament.entity';

export class UpdateTournamentDto {
  @IsOptional()
  @IsEnum(TournamentStatus, { message: 'Invalid status value.' })
  status?: TournamentStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  tournamentName?: string;

  @IsOptional()
  @IsDateString()
  startDateTime?: string;
}

import {
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  tournamentName: string;

  @IsDateString()
  @IsNotEmpty()
  startDateTime: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  modalityId: string;
}

import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateModalityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10, {
    message: 'Modality ID cannot be longer than 10 characters.',
  })
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'Modality ID can only contain lowercase letters, numbers, and underscores.',
  })
  modalityId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50, {
    message: 'Modality name cannot be longer than 50 characters.',
  })
  modalityName: string;
}

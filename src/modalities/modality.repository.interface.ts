import { Modality } from './entities/modality.entity';
import { CreateModalityDto } from './dto/create-modality.dto';

export const IModalityRepository = Symbol('IModalityRepository');

export interface IModalityRepository {
  create(dto: CreateModalityDto): Promise<Modality>;
  findAll(): Promise<Modality[]>;
  findById(modalityId: string): Promise<Modality | null>;
  remove(modalityId: string): Promise<boolean>;
}

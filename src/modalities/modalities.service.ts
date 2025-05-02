import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IModalityRepository } from './modality.repository.interface';
import { Modality } from './entities/modality.entity';
import { CreateModalityDto } from './dto/create-modality.dto';

@Injectable()
export class ModalitiesService {
  constructor(
    @Inject(IModalityRepository)
    private readonly modalityRepository: IModalityRepository,
  ) {}

  async create(createModalityDto: CreateModalityDto): Promise<Modality> {
    return this.modalityRepository.create(createModalityDto);
  }

  async findAll(): Promise<Modality[]> {
    return this.modalityRepository.findAll();
  }

  async findOne(modalityId: string): Promise<Modality> {
    const modality = await this.modalityRepository.findById(modalityId);
    if (!modality) {
      throw new NotFoundException(`Modality with ID ${modalityId} not found.`);
    }
    return modality;
  }

  async remove(modalityId: string): Promise<void> {
    const wasDeleted = await this.modalityRepository.remove(modalityId);
    if (!wasDeleted) {
      throw new NotFoundException(
        `Modality with ID ${modalityId} not found for deletion.`,
      );
    }
  }
}

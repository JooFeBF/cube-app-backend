import { Module } from '@nestjs/common';
import { ModalitiesService } from './modalities.service';
import { ModalitiesController } from './modalities.controller';
import { IModalityRepository } from './modality.repository.interface';
import { MySQLModalityRepository } from './mysql-modality.repository';

@Module({
  controllers: [ModalitiesController],
  providers: [
    ModalitiesService,
    {
      provide: IModalityRepository,
      useClass: MySQLModalityRepository,
    },
  ],

  exports: [ModalitiesService, IModalityRepository],
})
export class ModalitiesModule {}

import { Module } from '@nestjs/common';
import { SolutionsService } from './solutions.service';
import { SolutionsController } from './solutions.controller';
import { ISolutionRepository } from './solution.repository.interface';
import { MySQLSolutionRepository } from './mysql-solution.repository';

import { ScramblesModule } from '../scrambles/scrambles.module';
import { TournamentsModule } from '../tournaments/tournaments.module';

@Module({
  imports: [ScramblesModule, TournamentsModule],
  controllers: [SolutionsController],
  providers: [
    SolutionsService,
    {
      provide: ISolutionRepository,
      useClass: MySQLSolutionRepository,
    },
  ],
})
export class SolutionsModule {}

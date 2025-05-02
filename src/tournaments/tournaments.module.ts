import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';

import { ITournamentRepository } from './tournament.repository.interface';
import { MySQLTournamentRepository } from './mysql-tournament.repository';

import { ScramblesModule } from '../scrambles/scrambles.module';

@Module({
  imports: [ScramblesModule],
  controllers: [TournamentsController],
  providers: [
    TournamentsService,

    {
      provide: ITournamentRepository,
      useClass: MySQLTournamentRepository,
    },
  ],

  exports: [TournamentsService, ITournamentRepository],
})
export class TournamentsModule {}

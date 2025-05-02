import { Module } from '@nestjs/common';
import { ScramblesService } from './scrambles.service';

import { IScrambleRepository } from './scramble.repository.interface';
import { MySQLScrambleRepository } from './mysql-scramble.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    ScramblesService,
    {
      provide: IScrambleRepository,
      useClass: MySQLScrambleRepository,
    },
  ],
  exports: [ScramblesService, IScrambleRepository],
})
export class ScramblesModule {}

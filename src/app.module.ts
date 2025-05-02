import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { ScramblesModule } from './scrambles/scrambles.module';
import { SolutionsModule } from './solutions/solutions.module';
import { ModalitiesModule } from './modalities/modalities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TournamentsModule,
    ScramblesModule,
    SolutionsModule,
    ModalitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { SolutionsService } from './solutions.service';
import { CreateSolutionDto } from './entities/create-solution.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../users/users.controller';
import { Solution } from './entities/solution.entity';

@Controller()
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('solutions')
  async create(
    @Body() createSolutionDto: CreateSolutionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Solution> {
    return this.solutionsService.createSolution(
      createSolutionDto,
      req.user.userId,
    );
  }

  @Get('tournaments/:tournamentId/solutions')
  async findByTournament(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
  ): Promise<Solution[]> {
    return this.solutionsService.findSolutionsByTournament(tournamentId);
  }

  @Get('tournaments/:tournamentId/users/:userId/solutions')
  @UseGuards(JwtAuthGuard)
  async findByUserAndTournamentExplicit(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Solution[]> {
    return this.solutionsService.findSolutionsByUserAndTournament(
      userId,
      tournamentId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/solutions')
  async findMySolutionsForTournament(
    @Query('tournamentId', ParseIntPipe) tournamentId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Solution[]> {
    return this.solutionsService.findSolutionsByUserAndTournament(
      req.user.userId,
      tournamentId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('solutions/:solutionId')
  async update(
    @Param('solutionId', ParseIntPipe) solutionId: number,
    @Body() updateSolutionDto: CreateSolutionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Solution> {
    return this.solutionsService.updateSolution(
      solutionId,
      updateSolutionDto,
      req.user.userId,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModalitiesService } from './modalities.service';
import { CreateModalityDto } from './dto/create-modality.dto';
import { Modality } from './entities/modality.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('modalities')
export class ModalitiesController {
  constructor(private readonly modalitiesService: ModalitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createModalityDto: CreateModalityDto,
  ): Promise<Modality> {
    return this.modalitiesService.create(createModalityDto);
  }

  @Get()
  async findAll(): Promise<Modality[]> {
    return this.modalitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') modalityId: string): Promise<Modality> {
    return this.modalitiesService.findOne(modalityId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') modalityId: string): Promise<void> {
    await this.modalitiesService.remove(modalityId);
  }
}

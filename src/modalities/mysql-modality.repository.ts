import {
  Injectable,
  Inject,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { DATABASE_POOL } from '../database/database.providers';
import { IModalityRepository } from './modality.repository.interface';
import { Modality } from './entities/modality.entity';
import { CreateModalityDto } from './dto/create-modality.dto';

@Injectable()
export class MySQLModalityRepository implements IModalityRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  private mapRowToModality(row: RowDataPacket | undefined): Modality | null {
    if (!row) return null;
    const modality = new Modality();
    modality.modalityId = row.modality_id;
    modality.modalityName = row.modality_name;
    return modality;
  }

  async create(dto: CreateModalityDto): Promise<Modality> {
    const query =
      'INSERT INTO modalities (modality_id, modality_name) VALUES (?, ?)';
    const values = [dto.modalityId, dto.modalityName];

    try {
      await this.pool.execute(query, values);

      const newModality = new Modality();
      newModality.modalityId = dto.modalityId;
      newModality.modalityName = dto.modalityName;
      return newModality;
    } catch (error) {
      console.error('Error creating modality:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `Modality with ID ${dto.modalityId} already exists.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error creating modality.',
      );
    }
  }

  async findAll(): Promise<Modality[]> {
    const query = 'SELECT * FROM modalities ORDER BY modality_name';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query);
      return rows
        .map((row) => this.mapRowToModality(row))
        .filter((m) => m !== null) as Modality[];
    } catch (error) {
      console.error('Error finding all modalities:', error);
      throw new InternalServerErrorException(
        'Database error finding all modalities.',
      );
    }
  }

  async findById(modalityId: string): Promise<Modality | null> {
    const query = 'SELECT * FROM modalities WHERE modality_id = ?';
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, [
        modalityId,
      ]);
      return this.mapRowToModality(rows[0]);
    } catch (error) {
      console.error(`Error finding modality by ID ${modalityId}:`, error);
      throw new InternalServerErrorException(
        'Database error finding modality by ID.',
      );
    }
  }

  async remove(modalityId: string): Promise<boolean> {
    const query = 'DELETE FROM modalities WHERE modality_id = ?';
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, [
        modalityId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting modality ID ${modalityId}:`, error);

      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException(
          `Cannot delete modality ${modalityId} because it is being used by existing tournaments.`,
        );
      }
      throw new InternalServerErrorException(
        'Database error deleting modality.',
      );
    }
  }
}

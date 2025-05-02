import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise'; // Import mysql2/promise

export const DATABASE_POOL = 'DATABASE_POOL';

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<mysql.Pool> => {
      return mysql.createPool({
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        user: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    },
  },
];

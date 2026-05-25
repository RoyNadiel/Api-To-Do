import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { POOL_TOKEN } from './database.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: POOL_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool => {
        const pool = new Pool({
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT', 5432),
          database: config.get<string>('DB_NAME'),
          user: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          ssl:
            config.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        });

        pool.on('error', (err) => {
          console.error('Unexpected pool error:', err.message);
        });

        return pool;
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}

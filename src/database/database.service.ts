import { Injectable, Inject } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { POOL_TOKEN } from './database.constants';

@Injectable()
export class DatabaseService {
  constructor(@Inject(POOL_TOKEN) private readonly pool: Pool) {}

  /**
   * Ejecuta una consulta SQL parametrizada y retorna todas las filas.
   */
  async query<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.pool.query<T>(sql, params);
    return result.rows;
  }

  /**
   * Ejecuta una consulta y retorna la primera fila o null.
   */
  async queryOne<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T | null> {
    const result = await this.pool.query<T>(sql, params);
    return result.rows[0] ?? null;
  }

  /**
   * Ejecuta una consulta y retorna el número de filas afectadas.
   */
  async execute(sql: string, params: unknown[] = []): Promise<number> {
    const result = await this.pool.query(sql, params);
    return result.rowCount ?? 0;
  }
}

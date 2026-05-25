import { IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const VALID_STATES = ['pendiente', 'en progreso', 'en revisión', 'completado'];

export class QueryTasksDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de usuario debe ser un entero' })
  usuario?: number;

  @IsOptional()
  @IsIn(VALID_STATES, {
    message: `El estado debe ser uno de: ${VALID_STATES.join(', ')}`,
  })
  estado?: string;
}

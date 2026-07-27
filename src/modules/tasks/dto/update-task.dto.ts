import { IsString, IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const VALID_STATES = ['pendiente', 'en progreso', 'en revisión', 'completado'];

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Los story points deben ser un entero' })
  @Min(0, { message: 'Los story points deben ser >= 0' })
  story_points?: number;

  @IsOptional()
  @IsIn(VALID_STATES, {
    message: `El estado debe ser uno de: ${VALID_STATES.join(', ')}`,
  })
  estado?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega debe ser una fecha válida' })
  fecha_entrega?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de usuario asignado debe ser un entero' })
  asignado_a?: number;
}

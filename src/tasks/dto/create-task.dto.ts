import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Los story points deben ser un entero' })
  @Min(0, { message: 'Los story points deben ser >= 0' })
  story_points?: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de entrega debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fecha_entrega?: string;

  @Type(() => Number)
  @IsInt({ message: 'El ID de usuario asignado debe ser un entero' })
  @IsNotEmpty({ message: 'El campo asignado_a es obligatorio' })
  asignado_a: number;
}

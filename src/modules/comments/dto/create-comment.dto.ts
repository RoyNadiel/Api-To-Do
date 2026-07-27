import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID de tarea debe ser un entero' })
  @IsNotEmpty({ message: 'El campo tarea_id es obligatorio' })
  tarea_id: number;

  @IsString({ message: 'El contenido debe ser un texto' })
  @IsNotEmpty({ message: 'El contenido es obligatorio' })
  contenido: string;
}

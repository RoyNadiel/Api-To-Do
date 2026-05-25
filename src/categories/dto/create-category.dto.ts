import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  @IsString({ message: 'El color debe ser un texto' })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe tener formato hexadecimal (e.g. #FF5733)',
  })
  color: string;
}

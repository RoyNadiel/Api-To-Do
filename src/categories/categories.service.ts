import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async delete(categoryId: number) {
    const category = await this.db.queryOne<{ id: number; nombre: string }>(
      'SELECT id, nombre FROM categorias WHERE id = $1',
      [categoryId],
    );

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${categoryId} no encontrada`);
    }

    await this.db.execute('DELETE FROM categorias WHERE id = $1', [categoryId]);

    return { message: `Categoría '${category.nombre}' eliminada exitosamente` };
  }
}

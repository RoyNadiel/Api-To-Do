import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateCommentDto, usuarioId: number) {
    // Verificar que la tarea existe
    const task = await this.db.queryOne<{ id: number }>('SELECT id FROM tareas WHERE id = $1', [dto.tarea_id]);

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${dto.tarea_id} no encontrada`);
    }

    const comment = await this.db.queryOne<Record<string, unknown>>(
      `INSERT INTO comentarios (contenido, usuario_id, tarea_id)
       VALUES ($1, $2, $3)
       RETURNING id, contenido, fecha, usuario_id, tarea_id`,
      [dto.contenido, usuarioId, dto.tarea_id],
    );

    return comment;
  }
}

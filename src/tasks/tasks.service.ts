import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}

  // ─── Queries ──────────────────────────────────────────────

  async findAll(filters: { usuario?: number; estado?: string }) {
    let sql = `
      SELECT id, nombre, descripcion, story_points, estado,
             fecha_entrega, creado_por, asignado_a, fecha_creacion
      FROM tareas
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.usuario) {
      sql += ` AND asignado_a = $${paramIndex++}`;
      params.push(filters.usuario);
    }

    if (filters.estado) {
      sql += ` AND estado = $${paramIndex++}`;
      params.push(filters.estado);
    }

    sql += ' ORDER BY fecha_creacion DESC';

    return this.db.query<Record<string, unknown>>(sql, params);
  }

  async findDetails(taskId: number) {
    // Obtener tarea
    const task = await this.db.queryOne<Record<string, unknown>>(
      `SELECT id, nombre, descripcion, story_points, estado,
              fecha_entrega, creado_por, asignado_a, fecha_creacion
       FROM tareas WHERE id = $1`,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${taskId} no encontrada`);
    }

    // Obtener comentarios
    const comentarios = await this.db.query<Record<string, unknown>>(
      `SELECT c.id, c.contenido, c.fecha, c.usuario_id, u.email AS usuario_email
       FROM comentarios c
       JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.tarea_id = $1
       ORDER BY c.fecha ASC`,
      [taskId],
    );

    // Obtener categorías
    const categorias = await this.db.query<Record<string, unknown>>(
      `SELECT cat.id, cat.nombre, cat.descripcion, cat.color
       FROM categorias cat
       JOIN tarea_categorias tc ON tc.categoria_id = cat.id
       WHERE tc.tarea_id = $1
       ORDER BY cat.nombre`,
      [taskId],
    );

    return { ...task, comentarios, categorias };
  }

  async findAvailableCategories(taskId: number) {
    // Verificar que la tarea existe
    await this.ensureTaskExists(taskId);

    return this.db.query<Record<string, unknown>>(
      `SELECT id, nombre, descripcion, color
       FROM categorias
       WHERE id NOT IN (
         SELECT categoria_id FROM tarea_categorias WHERE tarea_id = $1
       )
       ORDER BY nombre`,
      [taskId],
    );
  }

  // ─── Commands ─────────────────────────────────────────────

  async create(dto: CreateTaskDto, creadoPor: number) {
    // Validar que el usuario asignado existe
    await this.ensureUserExists(dto.asignado_a);

    const result = await this.db.queryOne<Record<string, unknown>>(
      `INSERT INTO tareas (nombre, descripcion, story_points, fecha_entrega, creado_por, asignado_a)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        dto.nombre,
        dto.descripcion ?? null,
        dto.story_points ?? null,
        dto.fecha_entrega ?? null,
        creadoPor,
        dto.asignado_a,
      ],
    );

    return result;
  }

  async update(taskId: number, dto: UpdateTaskDto) {
    // Verificar que la tarea existe
    await this.ensureTaskExists(taskId);

    // Si se actualiza asignado_a, validar que el usuario existe
    if (dto.asignado_a !== undefined) {
      await this.ensureUserExists(dto.asignado_a);
    }

    // Construir SET dinámico
    const fields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const allowedFields: (keyof UpdateTaskDto)[] = [
      'nombre',
      'descripcion',
      'story_points',
      'estado',
      'fecha_entrega',
      'asignado_a',
    ];

    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        params.push(dto[field]);
      }
    }

    if (fields.length === 0) {
      throw new BadRequestException(
        'No se proporcionaron campos para actualizar',
      );
    }

    params.push(taskId);

    const result = await this.db.queryOne<Record<string, unknown>>(
      `UPDATE tareas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    return result;
  }

  async associateCategory(taskId: number, categoryId: number) {
    await this.ensureTaskExists(taskId);
    await this.ensureCategoryExists(categoryId);

    // Verificar si ya existe la asociación
    const existing = await this.db.queryOne<Record<string, unknown>>(
      'SELECT 1 FROM tarea_categorias WHERE tarea_id = $1 AND categoria_id = $2',
      [taskId, categoryId],
    );

    if (existing) {
      throw new ConflictException('La categoría ya está asociada a esta tarea');
    }

    await this.db.execute(
      'INSERT INTO tarea_categorias (tarea_id, categoria_id) VALUES ($1, $2)',
      [taskId, categoryId],
    );

    return {
      message: 'Categoría asociada exitosamente',
      tarea_id: taskId,
      categoria_id: categoryId,
    };
  }

  async createAndAssociateCategory(
    taskId: number,
    dto: { nombre: string; descripcion?: string; color: string },
  ) {
    await this.ensureTaskExists(taskId);

    // Intentar buscar categoría existente por nombre
    let category = await this.db.queryOne<{
      id: number;
      nombre: string;
      descripcion: string;
      color: string;
    }>(
      'SELECT id, nombre, descripcion, color FROM categorias WHERE nombre = $1',
      [dto.nombre],
    );

    if (!category) {
      // Crear la categoría
      category = await this.db.queryOne<{
        id: number;
        nombre: string;
        descripcion: string;
        color: string;
      }>(
        `INSERT INTO categorias (nombre, descripcion, color)
         VALUES ($1, $2, $3)
         RETURNING id, nombre, descripcion, color`,
        [dto.nombre, dto.descripcion ?? null, dto.color],
      );
    }

    // Asociar a la tarea (ignorar si ya existe)
    const existing = await this.db.queryOne<Record<string, unknown>>(
      'SELECT 1 FROM tarea_categorias WHERE tarea_id = $1 AND categoria_id = $2',
      [taskId, category!.id],
    );

    if (!existing) {
      await this.db.execute(
        'INSERT INTO tarea_categorias (tarea_id, categoria_id) VALUES ($1, $2)',
        [taskId, category!.id],
      );
    }

    return { categoria: category, asociada: true };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async ensureTaskExists(taskId: number): Promise<void> {
    const task = await this.db.queryOne<{ id: number }>(
      'SELECT id FROM tareas WHERE id = $1',
      [taskId],
    );
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${taskId} no encontrada`);
    }
  }

  private async ensureUserExists(userId: number): Promise<void> {
    const user = await this.db.queryOne<{ id: number }>(
      'SELECT id FROM usuarios WHERE id = $1',
      [userId],
    );
    if (!user) {
      throw new BadRequestException(`Usuario con ID ${userId} no existe`);
    }
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const cat = await this.db.queryOne<{ id: number }>(
      'SELECT id FROM categorias WHERE id = $1',
      [categoryId],
    );
    if (!cat) {
      throw new NotFoundException(
        `Categoría con ID ${categoryId} no encontrada`,
      );
    }
  }
}

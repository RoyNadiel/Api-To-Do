import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateCategoryDto } from '@/modules/categories/dto/create-category.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─── GET ──────────────────────────────────────────────────

  @Get()
  findAll(@Query() query: QueryTasksDto) {
    return this.tasksService.findAll(query);
  }

  @Get(':id/details')
  findDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findDetails(id);
  }

  @Get(':taskId/available-categories')
  findAvailableCategories(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.tasksService.findAvailableCategories(taskId);
  }

  // ─── POST ─────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { userId: number }) {
    return this.tasksService.create(dto, user.userId);
  }

  @Post(':taskId/categories/:categoryId')
  @HttpCode(HttpStatus.CREATED)
  associateCategory(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.tasksService.associateCategory(taskId, categoryId);
  }

  @Post(':taskId/categories')
  @HttpCode(HttpStatus.CREATED)
  createAndAssociateCategory(@Param('taskId', ParseIntPipe) taskId: number, @Body() dto: CreateCategoryDto) {
    return this.tasksService.createAndAssociateCategory(taskId, dto);
  }

  // ─── PATCH ────────────────────────────────────────────────

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
}

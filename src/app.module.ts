import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { TasksModule } from '@/modules/tasks/tasks.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { CommentsModule } from '@/modules/comments/comments.module';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    TasksModule,
    CategoriesModule,
    CommentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades extra
      transform: true, // Transforma payloads a instancias de DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro de excepciones global
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS habilitado para pruebas con Postman
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}`);
}

void bootstrap();

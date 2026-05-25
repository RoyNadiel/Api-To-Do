# Prompt para desarrollo de API REST con NestJS y PostgreSQL

## Contexto

Eres un desarrollador experto en backend. Necesito implementar una API REST completa para un sistema de gestión de tareas, utilizando **NestJS** (TypeScript) como framework y **PostgreSQL** como base de datos. **No se permite el uso de ORM** (como TypeORM, Prisma, Sequelize). Debes utilizar el driver nativo `pg` o `node-postgres` para ejecutar consultas SQL directamente.

La API será probada con Postman y debe cumplir con los requisitos de autenticación, manejo de errores, códigos HTTP, y los endpoints detallados más abajo.

## Requisitos generales

- **Autenticación**: Endpoints protegidos (excepto login) mediante token JWT (vía header `Authorization: Bearer <token>`). El login recibe `email` y `contraseña`, valida contra la tabla `usuarios` y retorna el token.
- **Manejo de errores**: Retornar códigos HTTP apropiados:
  - `400 Bad Request` para datos inválidos (ej. story points negativos, referencias a IDs inexistentes, campos faltantes).
  - `401 Unauthorized` si falta token o es inválido.
  - `404 Not Found` si un recurso no existe.
  - `201 Created`, `200 OK`, etc. según corresponda.
- **Base de datos**: PostgreSQL. Debes generar un archivo `.sql` con la creación de tablas (respetando claves foráneas, relaciones muchos a muchos) y la carga de datos inicial de usuarios y categorías (según punto 11 del proyecto).
- **No usar ORM**: Ejecutar consultas SQL parametrizadas mediante `pg`.
- **Estructura del proyecto NestJS**: Módulos, controladores, servicios, y un módulo de base de datos que exponga un servicio para ejecutar consultas.

## Modelo de datos

Diseña el modelo relacional (diagrama y sentencias SQL) basado en:

### Tabla `usuarios`

- Debe contener al menos: 
- `id (serial PK)`
- `email (único)`
- `contraseña (hash)`
- `nombre (opcional, pero al menos email y password).`

> Según el proyecto, los usuarios ya están precargados. 

### Tabla `tareas`

- `id` serial PK
- `nombre` (text, not null)
- `descripcion` (text, nullable)
- `story_points` (integer, nullable, validar >=0)
- `estado` (enum: 'pendiente', 'en progreso', 'en revisión', 'completado') – valor por defecto 'pendiente'
- `fecha_entrega` (date, nullable)
- `creado_por` (integer, FK a `usuarios(id)`) – se extrae del token de sesión, no se envía en el body
- `asignado_a` (integer, FK a `usuarios(id)`, not null)
- `fecha_creacion` (timestamp with time zone, default now())

### Tabla `categorias`

- `id` serial PK
- `nombre` (text, not null, único)
- `descripcion` (text, nullable)
- `color` (text, not null, formato hexadecimal, ej. '#FF5733')

### Tabla `tarea_categorias` (relación muchos a muchos)

- `tarea_id` (FK a `tareas(id)`, on delete cascade)
- `categoria_id` (FK a `categorias(id)`, on delete cascade)
- PK compuesta

### Tabla `comentarios`

- `id` serial PK
- `contenido` (text, not null)
- `fecha` (timestamp with time zone, default now(), se autogenera en la API)
- `usuario_id` (FK a `usuarios(id)`) – del token de sesión
- `tarea_id` (FK a `tareas(id)`, on delete cascade)

> **Nota**: El proyecto indica que los usuarios y categorías ya están precargados. El script `.sql` debe incluir inserts de ejemplo para al menos 2-3 usuarios y 3-4 categorías.

## Endpoints requeridos (con sus especificaciones)

### 1. Login y logout (0.5 ptos)

- **POST /auth/login**
  - Body: `{ "email": "...", "password": "..." }`
  - Valida credenciales (comparar hash, podemos usar bcrypt).
  - Retorna: `{ "token": "jwt_token" }` o establece cookie.
  - Códigos: 200 OK, 401 Unauthorized.
- **POST /auth/logout** (opcional, pero se menciona; puede invalidar token del lado del cliente o simplemente requerir eliminar token/cookie).

### 2. Crear tarea (1.5 ptos)

- **POST /tasks**
- Autenticación requerida.
- Body (todos opcionales excepto `asignado_a`):

```json
{
  "nombre": "string (obligatorio?)", // En el proyecto dice "debe recibir el nombre... a quién está asignado (obligatorio)". Asumir nombre y asignado_a obligatorios.
  "descripcion": "string (opcional)",
  "story_points": 5 (opcional, validar que sea >=0),
  "fecha_entrega": "YYYY-MM-DD (opcional)",
  "asignado_a": "id_usuario (obligatorio)"
}
```

- **creado_por**: Se obtiene del usuario autenticado (extraído del token JWT).
- **Estado por defecto**: `'pendiente'`.
- **Respuesta**: Retorna la tarea creada (incluyendo `id`, `estado` y fechas generadas).
- **Validaciones**: `story_points >= 0`; `asignado_a` debe existir en la tabla de usuarios; `nombre` no puede estar vacío.

### 3. Listar tareas (1.5 ptos)

`GET /tasks`

- **Autenticación**: Requerida.
- **Query params opcionales**:
  - `usuario`: ID de usuario (filtra tareas donde `asignado_a` = usuario).
  - `estado`: Uno de los valores permitidos.
- **Respuesta**: Retorna la lista de tareas (todos los campos excepto comentarios y categorías, los cuales corresponden al detalle).
- **Ejemplo**: `GET /tasks?usuario=2&estado=en progreso`

### 4. Actualizar tarea (0.5 ptos)

`PATCH /tasks/:id`

- **Autenticación**: Requerida.
- **Campos permitidos**: `nombre`, `descripción`, `story_points`, `estado`, `fecha_entrega`, `asignado_a`.
- **Restricciones**: Cualquier campo editable excepto `id` y `creado_por`.
- **Body**: Contiene uno o más campos a modificar.
- **Respuesta**: Retorna la tarea actualizada.
- **Validaciones**: Verificar la existencia de la tarea y validar las referencias a usuarios si se modifica el campo `asignado_a`.

### 5. Obtener detalles de una tarea (1.5 ptos)

`GET /tasks/:id/details`

- **Autenticación**: Requerida.
- **Respuesta**: Retorna un objeto con:
  - Todos los campos de la tarea.
  - `comentarios`: Array de objetos con `id`, `contenido`, `fecha`, `usuario_id` (o email del usuario).
  - `categorias`: Array de objetos con `id`, `nombre`, `descripcion`, `color`.

### 6. Asociar categoría a una tarea (0.5 ptos)

`POST /tasks/:taskId/categories/:categoryId`

- **Autenticación**: Requerida.
- **Acción**: Crea la relación en la tabla intermedia `tarea_categorias`.
- **Restricciones**: Si ya existe la relación, retorna `409 Conflict` o éxito.
- **Respuesta**: Retorna `201 Created` o `200 OK`.

### 7. Crear categoría y asociar automáticamente a una tarea (1.5 ptos)

`POST /tasks/:taskId/categories`

- **Autenticación**: Requerida.
- **Body**:

  ```json
  {
    "nombre": "...",
    "descripcion": "...",
    "color": "#XXXXXX"
  }
  ```

- **Acción**: Crea la categoría (si no existe, validar nombre único) y la asocia a la tarea especificada.
- **Respuesta**: Retorna la categoría creada (o existente) y la asociación.

### 8. Listar categorías no asociadas a una tarea (1 pto)

`GET /tasks/:taskId/available-categories`

- **Autenticación**: Requerida.
- **Acción**: Recibe `taskId` por ruta y retorna todas las categorías que no están asociadas a esa tarea.

### 9. Borrar categoría (0.5 ptos)

`DELETE /categories/:id`

- **Autenticación**: Requerida.
- **Acción**: Elimina la categoría y también las referencias en `tarea_categorias` (on delete cascade). El proyecto lo especifica explícitamente.
- **Respuesta**: Retorna `204 No Content` o `200 OK` con mensaje.

### 10. Crear comentario (1 pto)

`POST /comments`

- **Autenticación**: Requerida.
- **Body**: `{ "tarea_id": integer, "contenido": "texto" }`
- **Acción**: El `usuario_id` se obtiene del token, la fecha se genera automáticamente en la API (timestamp). Validar que la tarea exista.
- **Respuesta**: Retorna el comentario creado (con id, fecha, usuario_id, etc.).

## Consideraciones técnicas adicionales

- **Seguridad**: Las contraseñas deben almacenarse hasheadas (bcrypt). El login compara el hash.
- **Validación**: Usar `class-validator` + `class-transformer` con DTOs en NestJS para validar inputs.
- **Códigos de estado**:
  - Creación exitosa → `201 Created`
  - Actualización/eliminación exitosa → `200 OK` o `204 No Content`
  - Datos inválidos → `400 Bad Request` (con mensaje descriptivo)
  - Recurso no encontrado → `404 Not Found`
  - No autenticado → `401 Unauthorized`
- **JWT**: Almacenar secreto en variables de entorno. El token debe incluir sub (id de usuario) y email.
- **SQL**: Crear un servicio `DatabaseService` que exponga métodos como `query(sql, params)` usando `pg`. Usar connection pool.

## Entregables esperados (a generar por la IA)

- Modelo relacional en formato texto (descripción de tablas y relaciones).
- Archivo `schema.sql` con:
  - Creación de tablas (con constraints, claves foráneas, cascadas).
  - Inserción de datos iniciales: al menos 2 usuarios (con emails y contraseñas hasheadas) y 3 categorías.
  - (Opcional) creación de índices.
- Código completo del proyecto NestJS:
  - Estructura de carpetas (`src/modules`, `src/database`, etc.)
  - Módulo de base de datos (`DatabaseModule`, `DatabaseService`).
  - Módulo de autenticación (`AuthModule`, JWT strategy, guards).
  - Módulo de tareas (`TasksModule`).
  - Módulo de categorías (`CategoriesModule`).
  - Módulo de comentarios (`CommentsModule`).
  - DTOs, controladores, servicios con las consultas SQL parametrizadas.
- Colección de Postman (opcional pero útil) para probar los endpoints.

## Notas importantes del proyecto original

- Los usuarios y categorías ya están precargados en la BD (punto 11), pero el script debe incluirlos.
- No se puede usar ORM.
- La presentación es con Postman.
- Fecha de entrega: 28 de julio o 4 de agosto de 2026 (esto es solo informativo, no afecta el código).
- El token de autenticación puede ser JWT (recomendado) y se pasa en header o cookie.

## Formato de respuesta deseado

Proporciona el código fuente organizado en bloques de código con indicación de lenguaje (TypeScript, SQL). Asegúrate de explicar brevemente cada parte. Genera también el contenido del archivo `.sql` y los comandos para ejecutar el proyecto (instalación, configuración de variables de entorno, etc.).

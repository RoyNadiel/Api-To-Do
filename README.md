# API To-Do

Una API REST de gestión de tareas desarrollada con **NestJS**, **TypeScript**, **PostgreSQL** (alojado en **Supabase**), y **JWT** (autenticación segura con firma de clave asimétrica RS256).

---

## Características Principales

- 🔐 **Autenticación Asimétrica:** Generación y validación de tokens JWT usando algoritmo **RS256** (claves pública/privada en `keys/`).
- 🚪 **Cierre de Sesión Seguro:** Revocación en memoria mediante `TokenRevocationService` que invalida los tokens de manera inmediata (e impide su reutilización).
- 📋 **Gestión de Tareas:** CRUD de tareas con asignación de story points, estados y usuarios.
- 🏷️ **Categorización Flexible:** Creación de categorías y asociación/desasociación dinámica a las tareas.
- 💬 **Comentarios:** Sistema de comentarios asociados a tareas específicas.
- 🔍 **Filtrado Avanzado:** Búsqueda y listado de tareas filtrando por estado o usuario asignado.

---

## Requisitos Previos

- **Node.js** (versión 18 o superior recomendada)
- **pnpm** (o npm / yarn)
- Cuenta en **Supabase** (o base de datos PostgreSQL compatible)

---

## Configuración del Entorno

1. Clona el repositorio.
2. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```
3. Configura las variables de conexión a tu base de datos y la duración del JWT:

   ```env
   DB_HOST=aws-0-us-west-1.pooler.supabase.com  # Usa la dirección del Pooler (IPv4)
   DB_PORT=6543
   DB_NAME=postgres
   DB_USER=postgres.[ID_PROYECTO_SUPABASE]
   DB_PASSWORD=tu_contraseña
   DB_SSL=true

   JWT_EXPIRATION=1h
   PORT=3000
   ```

4. Genera las tablas iniciales y datos de prueba ejecutando el script `schema.sql` en el editor SQL de tu panel de Supabase.

---

## Instalación y Ejecución

Instala las dependencias del proyecto:

```bash
pnpm install
```

Arranca el servidor en modo desarrollo:

```bash
pnpm run start:dev
```

La API estará corriendo en `http://localhost:3000`.

---

## Endpoints de la API

### Autenticación (Auth)

- **POST** `/auth/login` - Inicio de sesión. Retorna el token JWT.
- **POST** `/auth/logout` - Cierre de sesión y revocación del token (Requiere Token).

### Tareas (Tasks)

- **GET** `/tasks` - Lista todas las tareas (Filtros opcionales `usuario` y `estado`). (Requiere Token).
- **GET** `/tasks/:id/details` - Muestra el detalle de una tarea junto con sus comentarios. (Requiere Token).
- **POST** `/tasks` - Crea una nueva tarea. (Requiere Token).
- **POST** `/tasks/:taskId/categories/:categoryId` - Asocia una categoría a la tarea. (Requiere Token).
- **POST** `/tasks/:taskId/categories` - Crea una nueva categoría y la asocia a la tarea. (Requiere Token).
- **PATCH** `/tasks/:id` - Actualiza el estado o datos de una tarea. (Requiere Token).

### Comentarios (Comments)

- **POST** `/comments` - Agrega un comentario a una tarea. (Requiere Token).

### Categorías (Categories)

- **DELETE** `/categories/:id` - Elimina una categoría del sistema. (Requiere Token).

---

## Estructura del Código

- `MODELO_RELACIONAL.txt` - Especificación completa del modelo relacional de la base de datos en formato texto.
- `src/database/` - Manejo de la conexión mediante cliente pooling de pg.
- `src/modules/auth/` - Lógica de login, estrategias de validación JWT (RS256) y revocación en memoria.
- `src/modules/tasks/` - Módulos, servicios, controladores y DTOs para las tareas.
- `src/modules/categories/` - Módulos y servicios de categorización.
- `src/modules/comments/` - Lógica de comentarios de las tareas.

---

## Licencia

Este proyecto está bajo la licencia MIT.

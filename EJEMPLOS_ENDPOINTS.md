# Guía de Uso de Endpoints y Payloads (API To-Do)

Esta guía detalla las especificaciones de cada endpoint, indicando qué datos **SÍ** deben enviarse, qué datos **NO** deben enviarse y ejemplos de respuestas.

> **Autenticación:** Todos los endpoints (excepto `POST /auth/login`) requieren el header:
> `Authorization: Bearer <token_jwt>`

---

## 1. Autenticación (Auth)

### `POST /auth/login`
Inicia sesión y obtiene el token JWT.

- **Header:** `Content-Type: application/json`
- **Qué SÍ enviar en el Body:**
  ```json
  {
    "email": "usuario1@mail.com",
    "password": "password123"
  }
  ```
- **Qué NO enviar:**
  - ❌ No enviar `id`, `nombre`, ni tokens.
- **Respuesta 200 OK:**
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Respuesta 401 Unauthorized:**
  ```json
  {
    "statusCode": 401,
    "message": "Credenciales inválidas"
  }
  ```

---

### `POST /auth/logout`
Cierra la sesión e invalida el token actual.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Qué SÍ enviar:** Body vacío `{}`.
- **Qué NO enviar:**
  - ❌ No enviar payloads ni contraseñas.
- **Respuesta 200 OK:**
  ```json
  {
    "message": "Sesión cerrada exitosamente"
  }
  ```

---

## 2. Tareas (Tasks)

### `GET /tasks`
Lista las tareas con filtros opcionales por query params.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Query Params opcionales:**
  - `?usuario=2` (Filtra tareas asignadas a ese ID).
  - `?estado=en progreso` (Filtra por estado: `'pendiente'`, `'en progreso'`, `'en revisión'`, `'completado'`).
  - Ejemplo combinado: `GET /tasks?usuario=2&estado=en progreso`
- **Qué NO enviar:** Body (los GET no usan body).
- **Respuesta 200 OK:**
  ```json
  [
    {
      "id": 1,
      "nombre": "Implementar módulo de pagos",
      "descripcion": "Integrar pasarela de pagos con Stripe",
      "story_points": 5,
      "estado": "en progreso",
      "fecha_entrega": "2026-08-15T00:00:00.000Z",
      "creado_por": 1,
      "asignado_a": 2,
      "fecha_creacion": "2026-07-27T04:00:00.000Z"
    }
  ]
  ```

---

### `GET /tasks/:id/details`
Obtiene el detalle completo de una tarea incluyendo sus comentarios y categorías asociadas.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Ruta:** `/tasks/1/details`
- **Qué NO enviar:** Body.
- **Respuesta 200 OK:**
  ```json
  {
    "id": 1,
    "nombre": "Implementar módulo de pagos",
    "descripcion": "Integrar pasarela de pagos con Stripe",
    "story_points": 8,
    "estado": "completado",
    "fecha_entrega": "2026-08-15T00:00:00.000Z",
    "creado_por": 1,
    "asignado_a": 2,
    "fecha_creacion": "2026-07-27T04:00:00.000Z",
    "comentarios": [
      {
        "id": 1,
        "contenido": "Revisado e integrado correctamente",
        "fecha": "2026-07-27T04:30:00.000Z",
        "usuario_id": 2,
        "usuario_email": "maria@mail.com"
      }
    ],
    "categorias": [
      {
        "id": 2,
        "nombre": "Feature",
        "descripcion": "Nuevas funcionalidades",
        "color": "#3498DB"
      }
    ]
  }
  ```

---

### `POST /tasks`
Crea una nueva tarea en el sistema.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Qué SÍ enviar en el Body:**
  ```json
  {
    "nombre": "Implementar módulo de pagos",
    "descripcion": "Integrar pasarela de pagos con Stripe",
    "story_points": 5,
    "fecha_entrega": "2026-08-15",
    "asignado_a": 2
  }
  ```
  *(Campos obligatorios: `nombre` y `asignado_a`. Los demás son opcionales).*
- **Qué NO enviar:**
  - ❌ `id` (Se autogenera como SERIAL en PostgreSQL).
  - ❌ `creado_por` (Se extrae automáticamente del token de sesión JWT).
  - ❌ `estado` (Se asigna por defecto como `'pendiente'`).
  - ❌ `fecha_creacion` (Se genera automáticamente como `NOW()`).
  - ❌ `story_points` negativos (Provoca error `400 Bad Request`).
- **Respuesta 201 Created:**
  ```json
  {
    "id": 1,
    "nombre": "Implementar módulo de pagos",
    "descripcion": "Integrar pasarela de pagos con Stripe",
    "story_points": 5,
    "estado": "pendiente",
    "fecha_entrega": "2026-08-15T00:00:00.000Z",
    "creado_por": 1,
    "asignado_a": 2,
    "fecha_creacion": "2026-07-27T04:00:00.000Z"
  }
  ```

---

### `POST /tasks/:taskId/categories/:categoryId`
Asocia una categoría existente a una tarea.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Ruta:** `/tasks/1/categories/2`
- **Qué SÍ enviar:** Ningún Body requerido.
- **Respuesta 201 Created:**
  ```json
  {
    "message": "Categoría asociada exitosamente",
    "tarea_id": 1,
    "categoria_id": 2
  }
  ```
- **Respuesta 409 Conflict (si ya está asociada):**
  ```json
  {
    "statusCode": 409,
    "message": "La categoría ya está asociada a esta tarea"
  }
  ```

---

### `POST /tasks/:taskId/categories`
Crea una nueva categoría (si no existe) y la asocia automáticamente a la tarea.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Ruta:** `/tasks/1/categories`
- **Qué SÍ enviar en el Body:**
  ```json
  {
    "nombre": "Seguridad",
    "descripcion": "Tareas relacionadas con parches de seguridad",
    "color": "#9B59B6"
  }
  ```
  *(Nota: El color debe ser un formato Hexadecimal válido `#XXXXXX`).*
- **Qué NO enviar:**
  - ❌ `id` (Se autogenera).
  - ❌ `taskId` o `categoria_id` en el Body (Van en la ruta).
- **Respuesta 201 Created:**
  ```json
  {
    "categoria": {
      "id": 5,
      "nombre": "Seguridad",
      "descripcion": "Tareas relacionadas con parches de seguridad",
      "color": "#9B59B6"
    },
    "asociada": true
  }
  ```

---

### `GET /tasks/:taskId/available-categories`
Lista las categorías que aún NO están asociadas a la tarea especificada.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Ruta:** `/tasks/1/available-categories`
- **Qué NO enviar:** Body.
- **Respuesta 200 OK:**
  ```json
  [
    {
      "id": 1,
      "nombre": "Bug",
      "descripcion": "Errores y defectos del sistema",
      "color": "#E74C3C"
    }
  ]
  ```

---

### `PATCH /tasks/:id`
Actualiza parcialmente los datos de una tarea existente.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Ruta:** `/tasks/1`
- **Qué SÍ enviar en el Body (uno o más campos a modificar):**
  ```json
  {
    "estado": "completado",
    "story_points": 8
  }
  ```
- **Qué NO enviar:**
  - ❌ `id` (Vía parámetro de ruta).
  - ❌ `creado_por` (No es modificable).
  - ❌ `fecha_creacion` (No es modificable).
  - ❌ Atributos no reconocidos (provocan error de validación `400 Bad Request`).
- **Respuesta 200 OK:**
  ```json
  {
    "id": 1,
    "nombre": "Implementar módulo de pagos",
    "descripcion": "Integrar pasarela de pagos con Stripe",
    "story_points": 8,
    "estado": "completado",
    "fecha_entrega": "2026-08-15T00:00:00.000Z",
    "creado_por": 1,
    "asignado_a": 2,
    "fecha_creacion": "2026-07-27T04:00:00.000Z"
  }
  ```

---

## 3. Comentarios (Comments)

### `POST /comments`
Agrega un comentario a una tarea.

- **Header:** `Authorization: Bearer <token_jwt>`
- **Qué SÍ enviar en el Body:**
  ```json
  {
    "tarea_id": 1,
    "contenido": "Revisado e integrado correctamente"
  }
  ```
- **Qué NO enviar:**
  - ❌ `id` (Autogenerado).
  - ❌ `usuario_id` (Se extrae automáticamente del token de sesión JWT).
  - ❌ `fecha` (Se autogenera en la API con la fecha/hora actual).
- **Respuesta 201 Created:**
  ```json
  {
    "id": 1,
    "contenido": "Revisado e integrado correctamente",
    "fecha": "2026-07-27T04:30:00.000Z",
    "usuario_id": 1,
    "tarea_id": 1
  }
  ```
- **Respuesta 404 Not Found (si la tarea no existe):**
  ```json
  {
    "statusCode": 404,
    "message": "Tarea con ID 999 no encontrada"
  }
  ```

---

## 4. Categorías (Categories)

### `DELETE /categories/:id`
Elimina una categoría del sistema (elimina en cascada sus relaciones en `tarea_categorias`).

- **Header:** `Authorization: Bearer <token_jwt>`
- **Ruta:** `/categories/5`
- **Qué NO enviar:** Body.
- **Respuesta 200 OK:**
  ```json
  {
    "message": "Categoría 'Seguridad' eliminada exitosamente"
  }
  ```

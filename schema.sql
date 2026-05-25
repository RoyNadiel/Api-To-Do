-- ============================================
-- Schema: API de Gestión de Tareas
-- PostgreSQL 14+
-- ============================================

-- Limpiar objetos existentes (idempotente)
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS tarea_categorias CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TYPE IF EXISTS estado_tarea CASCADE;

-- Enum para estados de tarea
CREATE TYPE estado_tarea AS ENUM (
  'pendiente',
  'en progreso',
  'en revisión',
  'completado'
);

-- ============================================
-- Tabla: usuarios
-- ============================================
CREATE TABLE usuarios (
  id         SERIAL       PRIMARY KEY,
  email      TEXT         NOT NULL UNIQUE,
  contrasena TEXT         NOT NULL,
  nombre     TEXT
);

-- ============================================
-- Tabla: categorias
-- ============================================
CREATE TABLE categorias (
  id          SERIAL  PRIMARY KEY,
  nombre      TEXT    NOT NULL UNIQUE,
  descripcion TEXT,
  color       TEXT    NOT NULL
);

-- ============================================
-- Tabla: tareas
-- ============================================
CREATE TABLE tareas (
  id             SERIAL        PRIMARY KEY,
  nombre         TEXT          NOT NULL,
  descripcion    TEXT,
  story_points   INTEGER       CHECK (story_points >= 0),
  estado         estado_tarea  NOT NULL DEFAULT 'pendiente',
  fecha_entrega  DATE,
  creado_por     INTEGER       NOT NULL REFERENCES usuarios(id),
  asignado_a     INTEGER       NOT NULL REFERENCES usuarios(id),
  fecha_creacion TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: tarea_categorias (muchos a muchos)
-- ============================================
CREATE TABLE tarea_categorias (
  tarea_id     INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  PRIMARY KEY (tarea_id, categoria_id)
);

-- ============================================
-- Tabla: comentarios
-- ============================================
CREATE TABLE comentarios (
  id          SERIAL      PRIMARY KEY,
  contenido   TEXT        NOT NULL,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id  INTEGER     NOT NULL REFERENCES usuarios(id),
  tarea_id    INTEGER     NOT NULL REFERENCES tareas(id) ON DELETE CASCADE
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX idx_tareas_asignado_a   ON tareas(asignado_a);
CREATE INDEX idx_tareas_estado       ON tareas(estado);
CREATE INDEX idx_tareas_creado_por   ON tareas(creado_por);
CREATE INDEX idx_comentarios_tarea   ON comentarios(tarea_id);
CREATE INDEX idx_comentarios_usuario ON comentarios(usuario_id);

-- ============================================
-- Datos iniciales: Usuarios
--   usuario1@mail.com -> password123
--   usuario2@mail.com -> password456
--   admin@mail.com    -> admin789
-- ============================================
INSERT INTO usuarios (email, contrasena, nombre) VALUES
  ('usuario1@mail.com', '$2b$10$F8lGiA7XrOsKC.tsU8SW/ejmSnWMSchX7xOTu7Mw6FirldDyQCsz6', 'Juan Pérez'),
  ('usuario2@mail.com', '$2b$10$sSUc/zxSMmTOAd7OBzARyeF88kqKkT3uUfNieIqe1Nx.15inPI2Ze', 'María García'),
  ('admin@mail.com',    '$2b$10$L9yeQTP3.OnEcdKz2ZHPpe8c73Thxj7ZeMonuiUZzUfIH9G8gwOlq', 'Admin Sistema');

-- ============================================
-- Datos iniciales: Categorías
-- ============================================
INSERT INTO categorias (nombre, descripcion, color) VALUES
  ('Bug',           'Errores y defectos del sistema',       '#E74C3C'),
  ('Feature',       'Nuevas funcionalidades',               '#3498DB'),
  ('Mejora',        'Mejoras a funcionalidades existentes',  '#2ECC71'),
  ('Documentación', 'Tareas relacionadas con documentación', '#F39C12');

CREATE INDEX idx_tareas_fecha_entrega ON tareas(fecha_entrega);
CREATE INDEX idx_usuarios_email ON usuarios(email);
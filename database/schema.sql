-- =========================================================
-- FPPT · Estructura de la base de datos (PostgreSQL / Supabase)
-- Se ejecuta con:  npm run db:crear   (o pegándolo en el "SQL Editor" de Supabase)
-- ¡CUIDADO! Borra las tablas de FPPT y las vuelve a crear vacías.
-- =========================================================

DROP TABLE IF EXISTS sesiones, archivos_zip, proyecto_tecnologias, tecnologias,
  proyecto_integrantes, proyecto_propietarios, proyectos, usuarios CASCADE;
DROP FUNCTION IF EXISTS fppt_tocar_actualizado() CASCADE;

-- Usuarios del sitio. El rol "docente" o "admin" lo asigna el equipo.
CREATE TABLE usuarios (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,              -- nombre completo
  email          VARCHAR(160) NOT NULL UNIQUE,       -- Gmail escolar (siempre en minúsculas)
  dni            VARCHAR(10)  NOT NULL UNIQUE,       -- solo lo ve el admin
  password_hash  VARCHAR(255) NOT NULL,              -- nunca se guarda la contraseña real
  rol            TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante', 'docente', 'admin')),
  activo         BOOLEAN NOT NULL DEFAULT TRUE,      -- FALSE = cuenta bloqueada
  creado         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Proyectos de software.
CREATE TABLE proyectos (
  id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo             VARCHAR(150) NOT NULL,
  descripcion_corta  VARCHAR(200) NOT NULL,          -- la que se ve en la tarjeta
  descripcion        TEXT NOT NULL,                  -- la del detalle
  curso              SMALLINT NOT NULL CHECK (curso BETWEEN 1 AND 7),
  division           VARCHAR(10) NOT NULL,           -- ej: "2da"
  anio               SMALLINT NOT NULL,              -- año lectivo, ej: 2025
  turno              TEXT NOT NULL CHECK (turno IN ('Mañana', 'Tarde', 'Vespertino')),
  materia            TEXT NOT NULL CHECK (materia IN ('Proyecto 1', 'Proyecto 2', 'Proyecto 3')),
  estado             TEXT NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('terminado', 'en_curso', 'abandonado')),
  -- Por ahora los proyectos se publican al instante ('aprobado').
  -- 'pendiente' y 'rechazado' quedan para cuando exista la revisión docente.
  estado_revision    TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_revision IN ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo     VARCHAR(255),
  revisado_por       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_en        TIMESTAMPTZ,
  destacado          BOOLEAN NOT NULL DEFAULT FALSE,
  creado_por         INTEGER NOT NULL REFERENCES usuarios(id),  -- el alumno que lo subió
  creado             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_proyectos_publicos ON proyectos (estado_revision, destacado, creado);
CREATE INDEX idx_proyectos_filtros ON proyectos (materia, curso, anio);

-- "actualizado" se cambia solo cada vez que se modifica un proyecto
CREATE FUNCTION fppt_tocar_actualizado() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.actualizado := NOW();
  RETURN NEW;
END;
$$;
CREATE TRIGGER proyectos_actualizado BEFORE UPDATE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION fppt_tocar_actualizado();

-- Usuarios que pueden editar un proyecto (el creador + los que él agregue).
CREATE TABLE proyecto_propietarios (
  proyecto_id  INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (proyecto_id, usuario_id)
);

-- Integrantes que se muestran en el proyecto (pueden no tener cuenta).
CREATE TABLE proyecto_integrantes (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proyecto_id  INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre       VARCHAR(120) NOT NULL
);

-- Tecnologías (HTML, Java, Python, MySQL...)
CREATE TABLE tecnologias (
  id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE proyecto_tecnologias (
  proyecto_id    INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  tecnologia_id  INTEGER NOT NULL REFERENCES tecnologias(id) ON DELETE CASCADE,
  PRIMARY KEY (proyecto_id, tecnologia_id)
);

-- El ZIP de cada proyecto (uno solo: si se sube otro, se reemplaza).
-- El archivo queda en storage/zips de la computadora que hace de servidor;
-- "arbol_json" guarda la lista de carpetas y archivos para no abrir el ZIP en cada visita.
CREATE TABLE archivos_zip (
  proyecto_id      INTEGER PRIMARY KEY REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre_original  VARCHAR(255) NOT NULL,
  ruta             VARCHAR(255) NOT NULL,           -- nombre del archivo dentro de storage/zips
  tamanio          BIGINT NOT NULL,                 -- en bytes
  arbol_json       JSONB NOT NULL,
  subido_por       INTEGER NOT NULL REFERENCES usuarios(id),
  subido           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sesiones iniciadas (las maneja src/config/sesiones.js).
CREATE TABLE sesiones (
  id      VARCHAR(128) PRIMARY KEY,
  datos   TEXT NOT NULL,
  expira  TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sesiones_expira ON sesiones (expira);

-- ---------------------------------------------------------
-- Seguridad en Supabase: Supabase publica automáticamente las tablas en una API
-- que se usa con la clave pública ("anon"). Activar RLS sin reglas bloquea ese
-- acceso: así nadie puede leer los DNI ni las contraseñas desde afuera.
-- Nuestro servidor no se ve afectado porque se conecta como dueño de las tablas.
-- ---------------------------------------------------------
ALTER TABLE usuarios               ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto_propietarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto_integrantes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tecnologias            ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto_tecnologias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos_zip           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones               ENABLE ROW LEVEL SECURITY;

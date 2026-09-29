-- =========================================================
-- FPPT · Estructura de la base de datos (MySQL / MariaDB)
-- Compatible con XAMPP. Se puede importar desde phpMyAdmin
-- o ejecutar con:  npm run db:crear
-- ¡CUIDADO! Borra y vuelve a crear la base "fppt".
-- =========================================================

DROP DATABASE IF EXISTS fppt;
CREATE DATABASE fppt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fppt;

-- Usuarios del sitio. El rol "docente" o "admin" lo asigna el equipo.
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,              -- nombre completo
  email          VARCHAR(160) NOT NULL UNIQUE,       -- Gmail escolar
  dni            VARCHAR(10)  NOT NULL UNIQUE,       -- solo lo ve el admin
  password_hash  VARCHAR(255) NOT NULL,              -- nunca se guarda la contraseña real
  rol            ENUM('estudiante','docente','admin') NOT NULL DEFAULT 'estudiante',
  activo         TINYINT(1)   NOT NULL DEFAULT 1,    -- 0 = cuenta bloqueada
  creado         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Proyectos de software.
CREATE TABLE proyectos (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo             VARCHAR(150) NOT NULL,
  descripcion_corta  VARCHAR(200) NOT NULL,          -- la que se ve en la tarjeta
  descripcion        TEXT         NOT NULL,          -- la del detalle
  curso              TINYINT UNSIGNED NOT NULL,      -- 1 a 7
  division           VARCHAR(10)  NOT NULL,          -- ej: "2da"
  anio               SMALLINT UNSIGNED NOT NULL,     -- año lectivo, ej: 2025
  turno              ENUM('Mañana','Tarde','Vespertino') NOT NULL,
  materia            ENUM('Proyecto 1','Proyecto 2','Proyecto 3') NOT NULL,
  estado             ENUM('terminado','en_curso','abandonado') NOT NULL DEFAULT 'en_curso',
  -- Revisión: nada se publica hasta que lo aprueba un docente o el admin
  estado_revision    ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  motivo_rechazo     VARCHAR(255) NULL,
  revisado_por       INT UNSIGNED NULL,
  revisado_en        DATETIME NULL,
  destacado          TINYINT(1)   NOT NULL DEFAULT 0,
  creado_por         INT UNSIGNED NOT NULL,          -- el alumno que lo subió
  creado             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_proyectos_creador  FOREIGN KEY (creado_por)   REFERENCES usuarios(id),
  CONSTRAINT fk_proyectos_revisor  FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_proyectos_publicos (estado_revision, destacado, creado),
  INDEX idx_proyectos_filtros (materia, curso, anio)
) ENGINE=InnoDB;

-- Usuarios que pueden editar un proyecto (el creador + los que él agregue).
CREATE TABLE proyecto_propietarios (
  proyecto_id  INT UNSIGNED NOT NULL,
  usuario_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (proyecto_id, usuario_id),
  CONSTRAINT fk_prop_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  CONSTRAINT fk_prop_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- Integrantes que se muestran en el proyecto (pueden no tener cuenta).
CREATE TABLE proyecto_integrantes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proyecto_id  INT UNSIGNED NOT NULL,
  nombre       VARCHAR(120) NOT NULL,
  CONSTRAINT fk_integ_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tecnologías (HTML, Java, Python, MySQL...)
CREATE TABLE tecnologias (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE proyecto_tecnologias (
  proyecto_id    INT UNSIGNED NOT NULL,
  tecnologia_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (proyecto_id, tecnologia_id),
  CONSTRAINT fk_ptec_proyecto   FOREIGN KEY (proyecto_id)   REFERENCES proyectos(id)   ON DELETE CASCADE,
  CONSTRAINT fk_ptec_tecnologia FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- El ZIP de cada proyecto (uno solo: si se sube otro, se reemplaza).
-- "arbol_json" guarda la lista de carpetas y archivos para no abrir el ZIP en cada visita.
CREATE TABLE archivos_zip (
  proyecto_id      INT UNSIGNED PRIMARY KEY,
  nombre_original  VARCHAR(255) NOT NULL,
  ruta             VARCHAR(255) NOT NULL,           -- nombre del archivo dentro de storage/zips
  tamanio          BIGINT UNSIGNED NOT NULL,        -- en bytes
  arbol_json       LONGTEXT NOT NULL,
  subido_por       INT UNSIGNED NOT NULL,
  subido           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_zip_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  CONSTRAINT fk_zip_usuario  FOREIGN KEY (subido_por)  REFERENCES usuarios(id)
) ENGINE=InnoDB;

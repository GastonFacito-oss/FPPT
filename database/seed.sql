-- =========================================================
-- FPPT · Datos de prueba
-- Proyectos FICTICIOS para probar el sitio. Borrar antes de la entrega.
-- Cuenta admin de prueba:  admin@ejemplo.edu.ar  /  CambiarEsta2026
-- =========================================================
USE fppt;

INSERT INTO usuarios (nombre, email, dni, password_hash, rol) VALUES
  ('Equipo FPPT',        'admin@ejemplo.edu.ar',      '00000001', '$2b$10$ue9hkXnO5Ki6SU8FHpj1FOyJh2gy1RN2nD.yEwylbvPnffI4QssCu', 'admin'),
  ('Docente de Prueba',  'docente@ejemplo.edu.ar',    '00000002', '$2b$10$ue9hkXnO5Ki6SU8FHpj1FOyJh2gy1RN2nD.yEwylbvPnffI4QssCu', 'docente'),
  ('Estudiante de Prueba','estudiante@ejemplo.edu.ar','00000003', '$2b$10$ue9hkXnO5Ki6SU8FHpj1FOyJh2gy1RN2nD.yEwylbvPnffI4QssCu', 'estudiante');

INSERT INTO tecnologias (nombre) VALUES
  ('HTML'), ('CSS'), ('JavaScript'), ('Node.js'), ('Java'), ('Python'), ('MySQL'), ('C#'), ('Arduino'), ('PHP');

INSERT INTO proyectos
  (titulo, descripcion_corta, descripcion, curso, division, anio, turno, materia, estado, estado_revision, destacado, creado_por, revisado_por, revisado_en)
VALUES
  ('FPPT', 'Repositorio web para guardar y consultar los proyectos TIC de la escuela.',
   'Plataforma para preservar los proyectos de la orientación TIC: carga de proyectos, árbol de archivos, descarga y revisión docente.',
   6, '2da', 2026, 'Mañana', 'Proyecto 3', 'en_curso', 'aprobado', 1, 3, 1, NOW()),
  ('Gestor de biblioteca', 'Sistema para registrar préstamos y devoluciones de libros.',
   'Aplicación de escritorio en Java con base de datos MySQL para administrar el catálogo y los préstamos de la biblioteca.',
   5, '1ra', 2025, 'Tarde', 'Proyecto 2', 'terminado', 'aprobado', 1, 3, 1, NOW()),
  ('Juego de preguntas TIC', 'Trivia web para repasar contenidos de programación.',
   'Juego hecho con HTML, CSS y JavaScript con preguntas por niveles y tabla de puntajes.',
   4, '3ra', 2025, 'Mañana', 'Proyecto 1', 'terminado', 'aprobado', 0, 3, 2, NOW()),
  ('Control de stock del buffet', 'Registro de productos, ventas y faltantes del buffet escolar.',
   'Sistema web con Node.js y MySQL que avisa cuando un producto está por agotarse.',
   6, '1ra', 2024, 'Tarde', 'Proyecto 3', 'terminado', 'aprobado', 0, 3, 1, NOW()),
  ('Agenda de turnos del laboratorio', 'Reserva de computadoras del aula TIC por horario.',
   'Aplicación en Python para que los cursos reserven el laboratorio sin superponerse.',
   5, '2da', 2024, 'Mañana', 'Proyecto 2', 'abandonado', 'aprobado', 0, 3, 2, NOW()),
  ('Proyecto pendiente de revisión', 'Este proyecto NO debe verse en el sitio hasta que lo aprueben.',
   'Sirve para probar que los proyectos pendientes no se muestran.',
   4, '1ra', 2026, 'Mañana', 'Proyecto 1', 'en_curso', 'pendiente', 0, 3, NULL, NULL);

INSERT INTO proyecto_propietarios (proyecto_id, usuario_id) VALUES (1,3),(2,3),(3,3),(4,3),(5,3),(6,3);

INSERT INTO proyecto_integrantes (proyecto_id, nombre) VALUES
  (1,'Gabriel Vázquez'),(1,'Ramiro Miraglia'),(1,'Rolando Quispe'),(1,'Lucas Bonavera'),(1,'Thiago Angrisani'),
  (2,'Integrante A'),(2,'Integrante B'),(3,'Integrante C'),(4,'Integrante D'),(5,'Integrante E'),(6,'Integrante F');

INSERT INTO proyecto_tecnologias (proyecto_id, tecnologia_id) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,7),
  (2,5),(2,7),
  (3,1),(3,2),(3,3),
  (4,4),(4,7),
  (5,6),
  (6,1);

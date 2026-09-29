# Plan de trabajo · FPPT

Entrega final: **miércoles 11 de noviembre de 2026**.
Metodología: Scrum con **6 sprints de una semana**.

## 1. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Acceso | Cualquiera puede **ver** proyectos sin cuenta. Para subir hay que registrarse con el **Gmail escolar**. No hay login por QR ni "olvidé mi contraseña" (la contraseña la restablece el admin). |
| Registro | Nombre completo, Gmail escolar, DNI y contraseña. El DNI solo lo ve el admin. |
| Roles | Estudiante, docente y admin. El admin es el equipo FPPT y asigna el rol de docente. |
| Datos del proyecto | Título, descripción corta, descripción, curso, división, año, turno, materia (Proyecto 1, 2 o 3), tecnologías, integrantes y estado (terminado, en curso o abandonado). |
| Propietarios | Lo sube un alumno, que puede agregar como propietarios a sus compañeros registrados. |
| Publicación | El proyecto queda **pendiente** hasta que lo aprueba un docente o el admin. |
| Archivos | Solo software. Un **ZIP de hasta 250 MB** por proyecto (se aceptan `.jar` adentro). El sitio muestra el árbol de carpetas. Se descarga el ZIP completo. Un ZIP nuevo reemplaza al anterior. |
| Proyectos viejos | Se pueden cargar proyectos de años anteriores. |
| Inicio | Mezcla de destacados y recientes. La tarjeta muestra nombre, descripción corta, materia y curso. Al hacer clic se abre el detalle con el árbol de archivos. |
| Navegación | Solo texto, sin íconos. |
| Pie de página | Logo de la ET20 y redes sociales (links ficticios por ahora). |
| Diseño | Azul `#326080` con celeste y crema, estilo moderno. Tipografía Plus Jakarta Sans. Logo FPPT (carpeta con tilde). Sin modo oscuro. |
| Stack | HTML, CSS y JS + **Node.js con Express** + **MySQL** (XAMPP). Se instala en un servidor de la red de la escuela. |
| Fuera de alcance | Perfil de usuario, comentarios, "me gusta", QR, recuperación de contraseña por email, inventario de componentes físicos. |

## 2. Arquitectura: cliente-servidor en 3 capas

```
Navegador (HTML + CSS + JS)
        │  pedidos HTTP
        ▼
Node.js + Express
  ├─ routes/        qué se hace en cada dirección
  ├─ controllers/   lógica de cada pantalla
  ├─ middlewares/   sesión, permisos, errores
  └─ models/        consultas SQL
        │
        ├──► MySQL: usuarios, proyectos, propietarios, integrantes, tecnologías, datos del ZIP
        └──► storage/zips: los archivos ZIP (fuera de la carpeta pública)
```

Es la misma arquitectura del documento (actividad 24). La única diferencia es que la lógica
se programa en JavaScript con Node.js en lugar de PHP: el equipo usa **un solo lenguaje**
en el navegador y en el servidor.

## 3. Modelo de datos

Ver `database/schema.sql`.

| Tabla | Para qué sirve |
|---|---|
| `usuarios` | nombre, email, dni, contraseña encriptada, rol, activo |
| `proyectos` | todos los datos del proyecto + estado de revisión y destacado |
| `proyecto_propietarios` | quiénes pueden editar cada proyecto |
| `proyecto_integrantes` | nombres de los integrantes (pueden no tener cuenta) |
| `tecnologias` / `proyecto_tecnologias` | tecnologías usadas por cada proyecto |
| `archivos_zip` | el ZIP del proyecto y su árbol de carpetas ya leído |

## 4. Pantallas

1. **Inicio**: destacados, recientes y cómo funciona.
2. **Proyectos**: muro completo con búsqueda y filtros.
3. **Detalle del proyecto**: datos, integrantes, tecnologías, árbol de archivos y "Descargar ZIP".
4. **Subir / editar proyecto**: formulario + ZIP con barra de progreso + propietarios.
5. **Ingresar** y **Crear cuenta**.
6. **Mis proyectos**: estado de cada proyecto (pendiente, aprobado o rechazado).
7. **Panel de administración**: aprobar, rechazar, destacar y eliminar proyectos; gestionar usuarios y roles.
8. **Sobre FPPT** y **Ayuda** (preguntas frecuentes y contacto).

## 5. Cronograma

| Sprint | Fechas | Objetivo | Estado |
|---|---|---|---|
| **1** | 30/9 – 6/10 | Base del proyecto: repositorio, servidor Express, base de datos, sistema de diseño, plantilla común, Inicio, Sobre FPPT y Ayuda | ✅ Base lista |
| **2** | 7/10 – 13/10 | Registro (Gmail escolar + DNI), login, logout, sesiones y permisos por rol | ✅ Listo (adelantado). Falta: dominio del Gmail escolar |
| **3** | 14/10 – 20/10 | Muro de proyectos, detalle, formulario de alta/edición y propietarios | 🟡 Detalle y formulario hechos como **demostración** (no guardan) |
| **4** | 21/10 – 27/10 | Subida del ZIP (250 MB) con barra de progreso, árbol de carpetas, reemplazo y descarga | Pendiente |
| **5** | 28/10 – 3/11 | Panel de admin y docentes (aprobar, destacar, usuarios), búsqueda y filtros, Mis proyectos | Pendiente |
| **6** | 4/11 – 10/11 | Pruebas con 5 usuarios, correcciones, manual de usuario, instalación en el servidor y backup | Pendiente |
| **Entrega** | **11/11** | Versión `v1.0` | |

### Detalle técnico por sprint

**Sprint 2 · Usuarios** ✅
- Paquetes: `bcryptjs` (encriptar contraseñas) y `express-session`. Las sesiones se guardan en la tabla
  `sesiones` con un almacén propio (`src/config/sesiones.js`); no se usa `express-mysql-session`
  porque trae una versión vieja de `mysql2` con vulnerabilidades.
- Registro: validar que el email termine en `@<dominio escolar>` (variable `EMAIL_DOMINIO` del `.env`), que el DNI tenga 7 u 8 números y que no estén repetidos.
- Middlewares `requiereLogin` y `requiereRol('docente', 'admin')`.
- Protección de formularios contra CSRF y límite de intentos de login.
- KPI: 5/5 funciones probadas (registro, validaciones, usuario repetido, login, credenciales incorrectas).

**Demostraciones ya hechas (se reemplazan en los Sprints 3 y 4)**
- `/proyectos/1` y `/proyectos/2`: detalle con árbol de archivos de ejemplo (`src/data/demo-archivos.js`).
  El botón "Descargar ZIP" solo muestra un aviso.
- `/subir` (requiere sesión): formulario completo. Al elegir un ZIP, el navegador lee su lista de archivos
  y muestra el árbol real, rechaza `.exe`/`.bat`/etc. y archivos de más de 250 MB. "Guardar proyecto"
  simula la barra de progreso y no envía nada.

**Sprint 3 · Proyectos**
- CRUD completo. Solo los propietarios (o el admin) editan y eliminan.
- Agregar propietarios buscando por email de compañeros registrados.
- Al crear o editar, el proyecto vuelve a quedar **pendiente**.

**Sprint 4 · Archivos**
- Paquete `multer` para recibir el ZIP directo al disco, con límite de 250 MB.
- Leer la lista de archivos del ZIP **sin descomprimirlo** (paquete `yauzl`) y guardarla en `arbol_json`.
- Rechazar ZIPs que tengan `.exe`, `.bat`, `.cmd`, `.msi`, `.vbs`, `.ps1` o `.scr`, rutas con `../`, o que no sean ZIP válidos.
- Descarga con `res.download()`. Nunca se ejecuta nada del ZIP.

**Sprint 5 · Administración y búsqueda**
- Bandeja de pendientes para docentes y admin, con motivo de rechazo.
- Filtros por materia, curso, año, turno, estado y tecnología + buscador por título y descripción.

**Sprint 6 · Cierre**
- Pruebas de uso con 5 personas externas al equipo (las elige el equipo).
- Manual de usuario dentro del sitio.
- Instalación en el servidor de la escuela: Node.js como servicio (`pm2` en Linux o `NSSM` en Windows), MySQL de XAMPP, backup de la base y de `storage/zips`.
- Borrar los datos de prueba y crear la cuenta admin real.

## 6. Roles del equipo

| Integrante | Rol | Tareas principales |
|---|---|---|
| Gabriel Vázquez | Product Owner | Prioriza el backlog, acepta cada sprint, contacto con los docentes |
| Ramiro Miraglia | Project Manager / Scrum Master | Tablero, dailies, planilla de seguimiento, coordina las pruebas |
| Rolando Quispe | Diseño UX/UI | Wireframes, sistema de diseño, textos, revisión visual de cada pantalla |
| Lucas | Desarrollo | Backend: base de datos, usuarios, archivos |
| Thiago Angrisani | Desarrollo | Frontend: vistas, formularios, muro, filtros |

## 7. Riesgos

| Riesgo | Qué hacemos |
|---|---|
| El servidor de la escuela no permite instalar Node.js | Confirmarlo en el Sprint 1 con el Departamento TICS. Plan B: usar una PC de la escuela como servidor dentro de la red. |
| Subir 250 MB por la red de la escuela tarda o se corta | Barra de progreso, mensaje claro si falla y prueba real en el Sprint 4. |
| ZIPs con archivos peligrosos | El ZIP no se descomprime ni se ejecuta, se guarda fuera de `public/` y se valida su contenido. |
| Datos personales (DNI, emails) | Contraseñas encriptadas, DNI visible solo para el admin, `.env` fuera de GitHub. |
| Falta de tiempo | Si un sprint se atrasa, lo primero que se recorta son los destacados y los filtros avanzados. |

## 8. Pendientes de confirmar

- [ ] Dominio del Gmail escolar (para validar el registro).
- [ ] Si cada proyecto lleva foto de portada propia o se usa la portada genérica según la materia (hoy: genérica).
- [ ] Correos reales de contacto (estudiantes, docentes, directivos, Departamento TICS).
- [ ] Links reales de las redes sociales.
- [ ] Apellido de Lucas tal como debe figurar en el sitio.

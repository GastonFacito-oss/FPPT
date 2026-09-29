# FPPT · Falta de Preservación de Proyectos TIC

Repositorio web para guardar, organizar y consultar los proyectos de software de la
orientación TIC de la **E.T. N°20 D.E. 20 “Carolina Muzilli”**.

Proyecto Integrador III · 6° 2da.

- Plan de trabajo: [`docs/plan.md`](docs/plan.md)
- Sistema de diseño: [`docs/sistema-de-diseno.md`](docs/sistema-de-diseno.md) (y en vivo en `/componentes`)

## Tecnologías

| Capa | Tecnología |
|---|---|
| Presentación | HTML (plantillas EJS), CSS, JavaScript |
| Lógica | Node.js + Express |
| Datos | MySQL / MariaDB (la que trae XAMPP) + carpeta `storage/zips` para los archivos |

## Cómo instalarlo en una computadora

### 1. Programas necesarios

1. **XAMPP** (solo se usa MySQL): <https://www.apachefriends.org>
2. **Node.js 20 o superior** (versión LTS): <https://nodejs.org>
3. **Git** y **VS Code**.

### 2. Descargar el proyecto

```bash
git clone https://github.com/GastonFacito-oss/FPPT.git
cd FPPT
npm install
```

### 3. Configurar

Copiar el archivo `.env.example` con el nombre `.env`.
En XAMPP el usuario de MySQL es `root` sin contraseña, así que no hace falta cambiar nada.

- `EMAIL_DOMINIO`: dominio del Gmail escolar (por ejemplo `et20.edu.ar`). Vacío = acepta cualquier email (solo para probar).
- `SESION_SECRETO`: en el servidor de la escuela, cambiarlo por una frase larga al azar.

> Si ya habías creado la base antes, volvé a ejecutar `npm run db:crear`: se agregó la tabla `sesiones`.

### 4. Crear la base de datos

1. Abrir el panel de XAMPP y darle **Start** a **MySQL** (Apache no hace falta).
2. Ejecutar:

```bash
npm run db:crear
```

Esto crea la base `fppt` con datos de prueba. **Borra todo lo que haya en esa base.**
También se puede importar `database/schema.sql` y después `database/seed.sql` desde phpMyAdmin.

### 5. Arrancar el sitio

```bash
npm run dev      # mientras se programa: se reinicia solo al guardar cambios
npm start        # modo normal
```

Abrir <http://localhost:3000>.
En <http://localhost:3000/salud> se ve si el servidor y la base de datos están funcionando.

### Qué se puede probar

| Dirección | Qué hay |
|---|---|
| `/` | Inicio con destacados y recientes |
| `/proyectos/1` y `/proyectos/2` | Detalle del proyecto con árbol de archivos (**demostración**: no descarga) |
| `/subir` | Formulario para subir un proyecto (**demostración**: no guarda). Hay que iniciar sesión |
| `/ingresar` y `/registro` | Inicio de sesión y creación de cuenta (funcionan de verdad) |
| `/sobre-fppt`, `/ayuda` | Información y preguntas frecuentes |
| `/componentes` | Guía del sistema de diseño |

### Cuentas de prueba

Todas tienen la contraseña `CambiarEsta2026`:

| Rol | Email |
|---|---|
| Admin | `admin@ejemplo.edu.ar` |
| Docente | `docente@ejemplo.edu.ar` |
| Estudiante | `estudiante@ejemplo.edu.ar` |

Los proyectos de `seed.sql` son **ficticios**, solo para probar. Se borran antes de la entrega.

## Estructura de carpetas

```
database/          schema.sql (tablas), seed.sql (datos de prueba), crear-base.js
docs/              plan y sistema de diseño
public/            archivos que ve el navegador: css/, js/, img/
src/
  server.js        arranca el servidor
  app.js           configura Express
  config/          lee el .env y conecta con MySQL
  routes/          qué controlador responde a cada dirección
  controllers/     reciben el pedido, piden datos y eligen la vista
  models/          consultas SQL
  middlewares/     funciones que se ejecutan antes o después de las rutas (errores, permisos...)
  views/           páginas EJS (partials/ = cabecera, pie, tarjeta)
storage/zips/      ZIPs subidos (no se suben a GitHub)
```

## Cómo trabajamos con Git

1. Actualizar `main`: `git pull`
2. Crear una rama por tarea: `git checkout -b sprint2-login`
3. Commits chicos con mensajes claros: `git commit -m "Agrega validación del DNI"`
4. Subir la rama y abrir un Pull Request. Otro integrante lo revisa antes de unirlo a `main`.

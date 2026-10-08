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
| Datos | PostgreSQL en **Supabase** (en la nube) + carpeta `storage/zips` para los archivos |

La base de datos está en Supabase y **la comparte todo el equipo**: una cuenta creada desde una
computadora sirve en todas. Los ZIP de los proyectos, en cambio, se guardan en la computadora
desde donde se subieron (ver "Archivos ZIP" más abajo).

## Supabase: crear la base (una sola vez, lo hace una persona del equipo)

1. Entrar a <https://supabase.com>, crear una cuenta y hacer clic en **New project**.
2. Nombre: `fppt`. Región: **South America (São Paulo)**. Elegir una **contraseña de la base**
   con letras y números (sin símbolos como `@ # / ?`) y anotarla.
3. Cuando el proyecto esté listo, hacer clic en **Connect** → pestaña **Connection String** →
   elegir **Session pooler** y copiar la dirección. Queda parecida a esta:

   ```
   postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

4. Reemplazar `[YOUR-PASSWORD]` por la contraseña del paso 2. Esa dirección completa es la
   **llave de la base**: pasársela al equipo **por privado** (nunca en GitHub, en un chat público
   ni en una IA). Si se filtra, cambiar la contraseña en Supabase:
   **Project Settings → Database → Reset database password**.

> El plan gratis de Supabase **pausa el proyecto si pasa una semana sin uso**. Si el sitio dice
> "Base de datos no disponible", entrar a supabase.com y hacer clic en **Restore project**.

## Cómo instalarlo en una computadora

### 1. Programas necesarios

1. **Node.js 20 o superior** (versión LTS): <https://nodejs.org>
2. **Git** y **VS Code**.

Ya no hace falta XAMPP.

### 2. Descargar el proyecto

```bash
git clone https://github.com/GastonFacito-oss/FPPT.git
cd FPPT
npm install
```

### 3. Configurar

Copiar el archivo `.env.example` con el nombre `.env` y completar:

- `DATABASE_URL`: la dirección de Supabase (la del paso 4 de arriba).
- `EMAIL_DOMINIO`: dominio del Gmail escolar (por ejemplo `et20.edu.ar`). Vacío = acepta cualquier email (solo para probar).
- `SESION_SECRETO`: en el servidor de la escuela, cambiarlo por una frase larga al azar.
- `DB_SSL_CERTIFICADO` (opcional): ruta al certificado de Supabase para verificar la conexión.
  Se descarga en **Project Settings → Database → SSL Configuration → Download certificate**;
  guardarlo en una carpeta `certificados/` (no se sube a GitHub).

### 4. Crear las tablas (solo la primera vez, una sola persona)

```bash
npm run db:crear
```

Crea las tablas y los datos de prueba. Si las tablas ya existen **no borra nada**, así que
cualquiera puede ejecutarlo sin miedo. Las tablas se ven en Supabase, en **Table Editor**.

Para **borrar todo** (cuentas y proyectos de todo el equipo) y empezar de cero:

```bash
npm run db:reiniciar
```

Pide escribir `BORRAR` para confirmar. También se puede pegar `database/schema.sql` y después
`database/seed.sql` en el **SQL Editor** de Supabase.

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
| `/` | Inicio: los proyectos subidos más recientes primero, y los destacados |
| `/proyectos` | Todos los proyectos, de a 12 por página |
| `/proyectos/1` y `/proyectos/2` | Proyectos **de ejemplo**: se ve el árbol de archivos pero no se pueden descargar |
| `/subir` | Subir un proyecto con su ZIP (hay que iniciar sesión). Al terminar aparece primero en el Inicio y se puede descargar |
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

### Archivos ZIP

Los ZIP que se suben se guardan en `storage/zips` **de la computadora donde corre el sitio** (no van a
Supabase ni a GitHub). Por eso, si un compañero sube un proyecto desde su computadora, todos lo ven
en el Inicio, pero el ZIP solo se puede descargar desde la de él: en las demás aparece el aviso
"Este ZIP se subió desde otra computadora". Cuando el sitio quede instalado en un único servidor
(el de la escuela), todos los ZIP van a estar en el mismo lugar.

`npm run db:reiniciar` también borra los ZIP de la computadora donde se ejecuta.

## Estructura de carpetas

```
database/          schema.sql (tablas, PostgreSQL), seed.sql (datos de prueba), crear-base.js
docs/              plan y sistema de diseño
public/            archivos que ve el navegador: css/, js/, img/
src/
  server.js        arranca el servidor
  app.js           configura Express
  config/          lee el .env y conecta con la base (Supabase)
  routes/          qué controlador responde a cada dirección
  controllers/     reciben el pedido, piden datos y eligen la vista
  models/          consultas SQL
  services/        reglas reutilizables: validaciones, lectura de ZIP, intentos de login
  middlewares/     funciones que se ejecutan antes o después de las rutas (sesión, permisos, subida, errores)
  data/            árboles de archivos de los proyectos de ejemplo
  views/           páginas EJS (partials/ = cabecera, pie, tarjeta)
storage/zips/      ZIPs subidos (no se suben a GitHub)
```

## Cómo trabajamos con Git

1. Actualizar `main`: `git pull`
2. Crear una rama por tarea: `git checkout -b sprint2-login`
3. Commits chicos con mensajes claros: `git commit -m "Agrega validación del DNI"`
4. Subir la rama y abrir un Pull Request. Otro integrante lo revisa antes de unirlo a `main`.

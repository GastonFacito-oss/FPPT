# Instalación en el servidor de la escuela (modo producción)

Guía para dejar FPPT publicado en internet con el dominio de la escuela.
Pensada para el Departamento TICS y el equipo FPPT.

## Cómo queda armado

```
Visitante (internet)
     │  https://fppt.<dominio-de-la-escuela>   (puerto 443)
     ▼
Apache (el de XAMPP) o nginx  ──  pone el HTTPS con el certificado del dominio
     │  http://127.0.0.1:3000   (solo dentro del servidor)
     ▼
FPPT (Node.js)  ──►  MySQL (solo dentro del servidor)
                └──►  storage/zips (los ZIP de los proyectos)
```

Desde internet **solo** se entra por el puerto 443 (HTTPS). Los puertos 3000 (FPPT) y 3306 (MySQL)
no se abren en el firewall.

## Qué hace el modo producción

Con `NODE_ENV=production` en el `.env`:

- `npm run db:crear` crea la base **vacía, sin cuentas ni proyectos de prueba**, y **nunca borra** una
  base que ya tiene datos.
- La pantalla de ingreso no muestra las cuentas de prueba, y no hay proyectos de ejemplo ni la guía
  `/componentes`.
- El sitio **no arranca** si `SESION_SECRETO` es la de ejemplo o si MySQL no tiene contraseña. Avisa si
  falta `EMAIL_DOMINIO`, `PROXY_CONFIABLE` o `HOST`.
- Cabeceras de seguridad (política de contenido, HSTS, etc.), cookie de sesión solo por HTTPS y caché
  de un día para CSS, JS e imágenes.
- El límite de intentos de login distingue a cada visitante aunque todos lleguen a través de Apache/nginx.

> En modo producción el sitio exige HTTPS. Para probar en la red local sin certificado, usar el modo
> desarrollo (`NODE_ENV` vacío).

## 1. Programas

- **Node.js 20 o superior** (LTS): <https://nodejs.org>
- **XAMPP** (MySQL y Apache) o MySQL/MariaDB + nginx en Linux.
- **Git** (opcional, para actualizar fácil).

## 2. Descargar el proyecto

```bash
git clone https://github.com/GastonFacito-oss/FPPT.git
cd FPPT
npm ci
```

(`npm ci` instala exactamente las versiones probadas.)

## 3. MySQL

### 3.1 Ponerle contraseña a "root"

En XAMPP, root viene **sin contraseña**. En un servidor publicado hay que ponerle una. Desde
**XAMPP → MySQL → Shell**, o con `C:\xampp\mysql\bin\mysql.exe -u root`:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'UNA-CONTRASEÑA-LARGA-PARA-ROOT';
```

(Si usan phpMyAdmin, hay que actualizar también su configuración en `C:\xampp\phpMyAdmin\config.inc.php`.)

### 3.2 Crear un usuario solo para FPPT

```sql
CREATE USER 'fppt'@'localhost' IDENTIFIED BY 'OTRA-CONTRASEÑA-LARGA';
GRANT ALL PRIVILEGES ON fppt.* TO 'fppt'@'localhost';
```

Este usuario solo puede tocar la base `fppt`.

### 3.3 Que MySQL no se pueda usar desde afuera

En `C:\xampp\mysql\bin\my.ini` (o `/etc/mysql/...` en Linux), en la sección `[mysqld]`:

```ini
bind-address = 127.0.0.1
```

Reiniciar MySQL. Y **no** abrir el puerto 3306 en el firewall.

## 4. El archivo `.env` del servidor

Copiar `.env.example` como `.env` y dejarlo así (con los datos reales):

```ini
NODE_ENV=production
PUERTO=3000
HOST=127.0.0.1

DB_HOST=localhost
DB_PUERTO=3306
DB_USUARIO=fppt
DB_CLAVE=OTRA-CONTRASEÑA-LARGA
DB_NOMBRE=fppt

EMAIL_DOMINIO=dominio-del-gmail-escolar.edu.ar
SESION_SECRETO=(pegar acá lo que muestra "npm run generar-secreto")
PROXY_CONFIABLE=1
ZIP_MAX_MB=250
```

Para generar la clave secreta:

```bash
npm run generar-secreto
```

El `.env` tiene contraseñas: no subirlo a GitHub ni compartirlo.

## 5. Crear la base y la cuenta de administrador

```bash
npm run db:crear
npm run crear-admin
```

`crear-admin` pide email, nombre, DNI y contraseña (la contraseña no se ve al escribirla). Si el email
ya tiene cuenta, la convierte en administrador.

Para los docentes: que primero se registren en el sitio y después:

```bash
npm run cambiar-rol -- docente@dominio-escolar.edu.ar docente
```

(Roles posibles: `estudiante`, `docente`, `admin`.)

Probar que arranca:

```bash
npm start
```

Tiene que decir `FPPT funcionando en http://localhost:3000 (modo producción)` y ningún "✖".
Cortarlo con Ctrl + C y seguir con el paso 6.

## 6. Dejarlo funcionando siempre (servicio)

### Windows: NSSM

1. Descargar NSSM de <https://nssm.cc> y descomprimirlo, por ejemplo en `C:\nssm`.
2. En una consola **como administrador**:

```bat
C:\nssm\win64\nssm.exe install FPPT "C:\Program Files\nodejs\node.exe" "src\server.js"
C:\nssm\win64\nssm.exe set FPPT AppDirectory "C:\FPPT"
C:\nssm\win64\nssm.exe set FPPT AppStdout "C:\FPPT\logs\fppt.log"
C:\nssm\win64\nssm.exe set FPPT AppStderr "C:\FPPT\logs\fppt.log"
C:\nssm\win64\nssm.exe start FPPT
```

(Cambiar `C:\FPPT` por la carpeta real y crear antes la carpeta `logs`.) El servicio arranca solo
cuando se prende el servidor. MySQL también tiene que estar como servicio: en el panel de XAMPP,
tildar la casilla **Service** de MySQL.

### Linux: pm2

```bash
sudo npm install -g pm2
pm2 start src/server.js --name fppt
pm2 save
pm2 startup     # muestra un comando: copiarlo y ejecutarlo
```

## 7. HTTPS con el dominio de la escuela

Hace falta:

1. Un nombre en el dominio de la escuela que apunte a la IP pública del servidor, por ejemplo
   `fppt.<dominio-de-la-escuela>` (lo configura quien administra el dominio).
2. Un certificado para ese nombre: el de la escuela, o uno gratis de Let's Encrypt
   (en Windows con **win-acme**: <https://www.win-acme.com>; en Linux con **certbot**).

### Opción A: Apache de XAMPP

En `C:\xampp\apache\conf\httpd.conf`, verificar que estas líneas **no** empiecen con `#`:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule headers_module modules/mod_headers.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule rewrite_module modules/mod_rewrite.so
Include conf/extra/httpd-ssl.conf
```

En `C:\xampp\apache\conf\extra\httpd-vhosts.conf` agregar (cambiando el nombre y las rutas de los
certificados):

```apache
# Todo lo que llega por http se manda a https
<VirtualHost *:80>
    ServerName fppt.dominio-de-la-escuela.edu.ar
    RewriteEngine On
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName fppt.dominio-de-la-escuela.edu.ar

    SSLEngine on
    SSLCertificateFile    "C:/certificados/fppt.crt"
    SSLCertificateKeyFile "C:/certificados/fppt.key"

    # Le avisa a FPPT que la visita llegó por HTTPS
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPreserveHost On
    ProxyPass        / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # Subidas de hasta 250 MB y con tiempo de sobra (30 minutos)
    LimitRequestBody 0
    ProxyTimeout 1800
    Timeout 1800
</VirtualHost>
```

Reiniciar Apache desde el panel de XAMPP.

### Opción B: nginx (Linux)

```nginx
server {
    listen 80;
    server_name fppt.dominio-de-la-escuela.edu.ar;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name fppt.dominio-de-la-escuela.edu.ar;

    ssl_certificate     /etc/letsencrypt/live/fppt.dominio-de-la-escuela.edu.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fppt.dominio-de-la-escuela.edu.ar/privkey.pem;

    client_max_body_size 260m;      # ZIP de hasta 250 MB
    proxy_read_timeout 1800s;
    proxy_send_timeout 1800s;
    proxy_request_buffering off;    # la barra de progreso muestra el avance real

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall

Abrir **solo** los puertos 80 y 443. No abrir 3000 ni 3306.

## 8. Copias de seguridad

Hay que guardar dos cosas: **la base** y **la carpeta `storage/zips`**. Las dos van juntas: una sin la
otra no sirve.

Windows (por ejemplo, todos los días con el Programador de tareas):

```bat
set FECHA=%date:~-4%-%date:~3,2%-%date:~0,2%
mkdir D:\backups-fppt\%FECHA%
C:\xampp\mysql\bin\mysqldump.exe -u fppt -pOTRA-CONTRASEÑA-LARGA --single-transaction fppt > D:\backups-fppt\%FECHA%\fppt.sql
robocopy C:\FPPT\storage\zips D:\backups-fppt\%FECHA%\zips /E
```

Linux:

```bash
FECHA=$(date +%F); mkdir -p /backups/fppt/$FECHA
mysqldump -u fppt -p --single-transaction fppt > /backups/fppt/$FECHA/fppt.sql
cp -r storage/zips /backups/fppt/$FECHA/
```

Guardar las copias en otro disco o en otra computadora. Para restaurar: `mysql -u fppt -p fppt < fppt.sql`
y copiar de vuelta la carpeta `zips`.

## 9. Actualizar el sitio

```bash
git pull
npm ci
```

Y reiniciar el servicio (`nssm restart FPPT` o `pm2 restart fppt`). La base y los ZIP no se tocan.

## 10. Lista final antes de publicar

- [ ] `NODE_ENV=production`, `HOST=127.0.0.1` y `PROXY_CONFIABLE=1` en el `.env`
- [ ] `SESION_SECRETO` generada con `npm run generar-secreto`
- [ ] `EMAIL_DOMINIO` con el dominio del Gmail escolar
- [ ] MySQL: root con contraseña, usuario `fppt` propio, `bind-address = 127.0.0.1`
- [ ] Base creada en modo producción (sin cuentas de prueba) y cuenta admin creada
- [ ] FPPT y MySQL como servicios (arrancan solos)
- [ ] HTTPS funcionando y http redirige a https
- [ ] Firewall: solo 80 y 443 abiertos
- [ ] Probar desde un celular con datos móviles (afuera de la red de la escuela): entrar, crear cuenta,
      subir un ZIP chico y descargarlo
- [ ] Copias de seguridad programadas

# GUÍA DE DESPLIEGUE LOCAL EN SERVIDOR UBUNTU (IP: 192.168.200.23)

Documento de referencia para el despliegue del **Sistema de Gestión de Inventarios** en la infraestructura local (Servidor Ubuntu + Docker + PostgreSQL + Respaldos en NAS).

---

## 📌 Datos de la Red y Servidor Local

* **IP del Servidor Ubuntu:** `192.168.200.23`
* **URL de Acceso a la App:** `http://192.168.200.23:8081`
* **API REST Backend:** `http://192.168.200.23:8080/api`
* **Base de Datos (PostgreSQL):** Puerto `5432`
* **Ruta de la NAS de Respaldos:** `//unasserver.edph.local/compartido`

---

## 🚀 FASE 1: Instalación de Dependencias Básicas (Ubuntu CLI)

Ejecutar en la terminal del servidor Ubuntu (vía SSH o consola directa):

```bash
# 1. Actualizar el sistema e instalar herramientas necesarias
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git cifs-utils nano

# 2. Habilitar permisos de Docker para el usuario sin sudo
sudo usermod -aG docker $USER
newgrp docker

# 3. Verificar versiones instaladas
docker --version
docker compose version
```

---

## ⚡ FASE 2: Despliegue Rápido de Pruebas (Docker Compose)

### 1. Clonar el Repositorio en el Servidor
```bash
cd /home/ubuntu
git clone <URL_DEL_REPOSITORIO> gestion-inventario
cd gestion-inventario
```

### 2. Crear el archivo de Variables de Entorno (`.env`)
Copiar el archivo de ejemplo o crear uno nuevo:
```bash
cp .env.example .env
nano .env
```

Asegurar las siguientes variables en `.env`:
```env
DB_USERNAME=inventario
DB_PASSWORD=inventario_pass_local
JWT_SECRET=<generar con: openssl rand -hex 48>
TZ=America/Guatemala
MAIL_USERNAME=dummy@example.com
MAIL_PASSWORD=dummy
```

> ⚠️ **`JWT_SECRET` debe tener 64 bytes o más.** La firma de sesión usa HS512 y
> con menos bytes el backend responde `500` en `/api/auth/login`
> (`io.jsonwebtoken.security.WeakKeyException`). No escribir un valor real en
> este archivo: está versionado en git. El placeholder de `.env.example`
> (`cambiar_esto`) también es inválido por este motivo.
>
> Generar y aplicar el secreto directamente en el servidor:
>
> ```bash
> sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" .env
> docker compose up -d --force-recreate backend
> ```

### 3. Levantar los Contenedores (Frontend, Backend y PostgreSQL)
```bash
# Construir imágenes y desplegar en segundo plano
docker compose up -d --build
```

### 4. Verificar Estado de los Servicios
```bash
docker compose ps
docker compose logs -f backend
```

> **Verificación:** Abrir en el navegador de cualquier equipo en la red local:
> 👉 **`http://192.168.200.23:8081`**

---

## 📁 FASE 3: Configuración de la NAS de Respaldos (`unasserver.edph.local`)

*(Esta fase vincula la carpeta de la NAS para recibir copias de seguridad automáticas)*.

### 1. Crear la carpeta de montaje local
```bash
sudo mkdir -p /mnt/nas_inventario
```

### 2. Crear credenciales seguras de la NAS
```bash
sudo nano /etc/nas-credentials
```

Agregar las credenciales del dominio local:
```text
username=TU_USUARIO_NAS
password=TU_PASSWORD_NAS
domain=edph.local
```

Proteger el archivo:
```bash
sudo chmod 600 /etc/nas-credentials
```

### 3. Configurar automontaje en `/etc/fstab`
```bash
sudo nano /etc/fstab
```

Añadir al final:
```text
//unasserver.edph.local/compartido /mnt/nas_inventario cifs credentials=/etc/nas-credentials,iocharset=utf8,noperm,_netdev 0 0
```

Montar inmediatamente:
```bash
sudo mount -a
```

---

## 💾 FASE 4: Tarea de Respaldo Automático a la NAS (Cron)

### 1. Script de Respaldo (`scripts/backup_nas.sh`)
Crear un script para volcar PostgreSQL comprimido directamente a la NAS:

```bash
sudo nano scripts/backup_nas.sh
```

Contenido:
```bash
#!/usr/bin/env bash
set -euo pipefail

FECHA=$(date +%Y-%m-%d_%H%M%S)
DESTINO="/mnt/nas_inventario/backups"

mkdir -p "$DESTINO"

# Generar dump de PostgreSQL desde el contenedor
docker exec -t gestion-inventario-db-1 pg_dump -U inventario inventario | gzip > "$DESTINO/backup_inventario_$FECHA.sql.gz"

# Eliminar respaldos mayores a 30 días
find "$DESTINO" -name "backup_inventario_*.sql.gz" -mtime +30 -delete
```

Hacer ejecutable el script:
```bash
chmod +x scripts/backup_nas.sh
```

### 2. Programar en Crontab (Diario a las 23:00)
```bash
crontab -e
```
Agregar la línea:
```cron
0 23 * * * /bin/bash /home/ubuntu/gestion-inventario/scripts/backup_nas.sh > /dev/null 2>&1
```

---

## 🔐 FASE 5: Acceso HTTPS con Túnel Cloudflare (habilita la cámara)

> **Solo para esta rama local.** Nada de esta fase se usa en `desa` / `pre` / `pro`.

### ¿Por qué es necesario?

El navegador solo habilita la cámara (`getUserMedia`) en un **contexto seguro**: HTTPS o `localhost`. Al entrar por `http://192.168.200.23:8081` no existe `navigator.mediaDevices` y el escáner QR falla con `Camera streaming not supported by the browser`. No es un bug: es el modelo de seguridad del navegador.

El túnel da una URL HTTPS con certificado público **sin instalar nada en los equipos y sin abrir puertos en el router**. Los usuarios (PC y celulares) abren la URL y la cámara funciona.

### 1. Levantar el túnel

```bash
cd /home/gestioninventario/siges/gestion-inventario-sprinReact/tunnel-local
docker compose up -d
```

### 2. Obtener la URL vigente

El *quick tunnel* genera un hostname **aleatorio que cambia en cada reinicio**:

```bash
./get-url.sh
./get-url.sh --check     # además verifica que responda HTTP 200
```

Ejemplo de salida: `https://tmp-aspects-heritage-pledge.trycloudflare.com`

### 3. Permitir ese origen en el backend

La allowlist de CORS se configura **por entorno** desde `.env` (nunca en código, para que el mismo build sirva en todos los ambientes):

```bash
cd /home/gestioninventario/siges/gestion-inventario-sprinReact
sed -i 's|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://localhost:*,http://192.168.200.*:*,https://*.trycloudflare.com|' .env
docker compose up -d --build backend
```

> ⚠️ **`--force-recreate` NO recompila.** Si el backend sigue rejecting un origen que sí está en `CORS_ALLOWED_ORIGINS`, casi siempre es que la imagen es vieja: usá `--build`. Un `.env` nuevo solo se aplica recreando el contenedor, pero un cambio en Java exige volver a compilar la imagen.

> `https://*.trycloudflare.com` es un comodín: cubre el hostname aleatorio sin
> tener que editar el `.env` cada vez que el túnel se reinicia.

### ⚠️ Limitaciones conocidas

| Tema | Detalle |
|---|---|
| **Hostname aleatorio** | Cambia en cada `docker compose restart`. Los usuarios necesitan la URL vigente. |
| **Sin garantía de uptime** | Cloudflare lo ofrece solo para pruebas; no es un servicio con SLA. |
| **Expone a internet** | La app queda accesible desde internet por Cloudflare. Para uso interno, proteger con Cloudflare Access o mantener el túnel apagado cuando no se use. |
| **`--protocol http2` es obligatorio** | Por QUIC/UDP el túnel se registra pero el hostname queda en `NXDOMAIN` porque la red estrangula UDP. |
| **Certificado autofirmado no sirve** | `tls internal` en Caddy **no** habilita la cámara: el navegador trata el certificado inválido como contexto no seguro. |

### Para una URL fija (tunnel nombrado)

Requiere cuenta de Cloudflare y un dominio administrado ahí:

```bash
# 1. Instalar cloudflared en el host y autenticarse contra la cuenta
cloudflared tunnel login
cloudflared tunnel create siges-local
cloudflared tunnel route dns siges-local inventario-local.tudominio.com

# 2. Sustituir el comando del contenedor por el token, en tunnel-local/docker-compose.yml
#    command: tunnel --no-autoupdate run --token <TOKEN>
```

---

## 📝 Comandos Útiles de Mantenimiento

* **Ver logs en tiempo real:** `docker compose logs -f`
* **Reiniciar servicios:** `docker compose restart`
* **Reconstruir y desplegar cambios nuevos tras `git pull`:** `docker compose up -d --build`
* **Detener todo:** `docker compose down`
* **URL pública del túnel:** `cd tunnel-local && ./get-url.sh`


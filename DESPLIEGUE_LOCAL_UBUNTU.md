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
JWT_SECRET=SjMu(rC<J7)UAmoz[,>}X}fxDe;=s$Y{|RDrTG3m@-oqHd=bv4[~wSz-40k
TZ=America/Guatemala
MAIL_USERNAME=dummy@example.com
MAIL_PASSWORD=dummy
```

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

## 📝 Comandos Útiles de Mantenimiento

* **Ver logs en tiempo real:** `docker compose logs -f`
* **Reiniciar servicios:** `docker compose restart`
* **Reconstruir y desplegar cambios nuevos tras `git pull`:** `docker compose up -d --build`
* **Detener todo:** `docker compose down`

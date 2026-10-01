# Estrategia de despliegue en producción

> Documento complementario a [`FLUJO_DESPLIEGUE.md`](../FLUJO_DESPLIEGUE.md).
> Ese doc explica **a qué rama** se promote un cambio.
> Este doc explica **cómo se ejecuta el despliegue en el servidor** y cómo evitar
> reinicios y ventanas de inaccesibilidad innecesarias.

---

## 1. Principio rector

> **Solo se reconstruye y reinicia lo que cambió.**

Los servicios del stack son independientes. Un cambio de frontend **no debe**
tocar PostgreSQL ni el backend, y un cambio de backend **no debe** tocar el
frontend. Verificado en el servidor (2026-10-01):

```
backend   Up 19 hours            ← intacto
db        Up 19 hours (healthy)  ← intacto
frontend  Recreated              ← único recreado
```

Comando usado (frontend solamente):

```bash
docker compose build frontend
docker compose up -d frontend
```

### Qué NO se puede evitar

| Cambio | ¿Rebuild? | ¿Reinicio? |
|---|---|---|
| Texto, CSS, componente React | Sí (Vite) | Sí, del contenedor frontend |
| Java (`service/`, `controller/`, DTO) | Sí (Gradle) | Sí, del contenedor backend |
| Migración Flyway | No | Sí, del contenedor backend |
| Solo `.env` | No | Sí, del servicio afectado |
| Nginx (`nginx.conf`) | Sí, del frontend | Sí, del frontend |

El frontend es estático: **cualquier cambio visual exige un build nuevo**. No hay
forma de "hotpatchear" un bundle ya servido sin reconstruirlo.

---

## 2. Brechas reales detectadas (verificar antes de producción)

Auditoría de `docker-compose.prod.yml` realizada en el servidor:

### 2.1 El backend no tiene healthcheck (riesgo de 502)

```yaml
backend:
  # NO tiene bloque healthcheck
frontend:
  depends_on:
    - backend      # sin `condition: service_healthy`
```

Consecuencia: al desplegar el backend, nginx puede recibir tráfico antes de que
Spring Boot esté listo y devuelve **502 Bad Gateway** durante unos segundos.

**Corrección propuesta:**

```yaml
backend:
  healthcheck:
    test: ["CMD-SHELL", "wget -qO- http://localhost:8080/api/auth/ping || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 12
    start_period: 60s
frontend:
  depends_on:
    backend:
      condition: service_healthy
```

Requiere un endpoint `/api/auth/ping` barato y público (verificar que
`SecurityConfig` lo permita sin JWT).

### 2.2 Sin `stop_grace_period`

Docker envía `SIGTERM` y espera 10 s por defecto. Si Spring Boot no termina
limpio, se le mata la petición en curso.

```yaml
backend:
  stop_grace_period: 40s   # margen para que Boot cierre conexiones y HikariCP
```

### 2.3 Sin rollback automático

Hoy, si un deploy del backend falla, hay que reconstruir a mano el commit
anterior. Con healthcheck se puede automatizar (ver §5).

### 2.4 El túnel cambia de hostname en cada reinicio

`deploy-local.sh` usa `cloudflared tunnel --url` (quick tunnel), que genera un
**subdominio aleatorio distinto en cada ejecución**. Válido para desarrollo;
**en producción implica redistribuir el enlace a todos los usuarios**.

**Producción:** dominio fijo (`inventario.midominio.gt`) + DNS, o Caddy con
certificado Let's Encrypt automático. Solo entonces URL estable.

---

## 3. Estrategia recomendada por etapa

Para un sistema interno de ~20 usuarios, **invertir en cero downtime es
sobreingeniería**. El orden por relación costo/beneficio:

| # | Acción | Costo | Downtime | Cuándo |
|---|---|---|---|---|
| 1 | Healthcheck del backend + `depends_on` | Bajo | ~0 | **Ahora** |
| 2 | `stop_grace_period` | Bajo | ~0 | **Ahora** |
| 3 | Ventana de mantenimiento programada | Bajo | 1–2 min | **Ahora** |
| 4 | CI/CD (build en GitHub, no en el servidor) | Medio | 0 | Cuando canse SSH manual |
| 5 | Rollback automático | Medio | 0 | Después de CI/CD |
| 6 | Montar `dist/` como volumen + `nginx -s reload` | Medio | ~0 | Al inicio tweaks de UI |
| 7 | Blue/green + proxy | Alto | ~0 | Solo si el sistema es crítico 24/7 |

### 3.1 Atajo para cambios solo de UI (paso 6)

Hoy `dist/` se copia dentro de la imagen. Si se monta como volumen:

```bash
# 1. Construir el bundle (o traerlo del build de CI)
cd frontend && npm run build

# 2. Recargar nginx SIN recrear el contenedor
docker compose exec frontend nginx -s reload
```

Recargar nginx no corta conexiones: los usuarios no se caen. Requiere que
`docker-compose.prod.yml` monte `./frontend/dist:/usr/share/nginx/html:ro`.

### 3.2 CI/CD (paso 4)

Flujo objetivo: el servidor **nunca compila**, solo descarga imágenes ya
construidas.

```
git push  ->  GitHub Actions (test + build)  ->  GHCR
          ->  en el servidor: docker compose pull && docker compose up -d
```

Ventajas: el build ocurre donde hay red rápida, el servidor solo hace `pull`,
y queda registro de qué commit se desplegó.

```yaml
# docker-compose.prod.yml — referencia a registry en vez de build local
services:
  backend:
    image: ghcr.io/carlosorrozco-1/gestion-inventario-backend:${TAG:-latest}
  frontend:
    image: ghcr.io/carlosorrozco-1/gestion-inventario-frontend:${TAG:-latest}
```

Nunca usar `latest` en producción: usar **tags por commit** para poder
rollbackear de forma determinista.

### 3.3 Rollback automático (paso 5)

Con `TAG` inmutable + healthcheck, un script puede:

1. Levantar el tag anterior.
2. Esperar el healthcheck (~60 s).
3. Si falla → volver al tag previo y notificar.

---

## 4. Migraciones de base de datos (el riesgo real)

> Flyway corre **al arrancar el backend**. Si una migración falla a mitad de
> un deploy, el backend no levanta y el sistema queda caído.

Reglas obligatorias:

1. **Respaldo antes de migrar.** Ver
   [`database/postgres/`](../database/postgres/) y `scripts/backup_nas.sh`.
2. **Patrón *expand / contract*** — la migración se divide en dos despliegues:
   - *Expand*: agregar columna/tabla nueva, **sin quitar ni renombrar nada**.
     La app vieja sigue funcionando contra el esquema nuevo.
   - *Contract*: en un deploy posterior, eliminar lo obsoleto.
   Nunca en el mismo deploy: si se mezclan, no hay rollback posible.
3. **Siempre retro-compatible.** Mientras coexistan dos versiones de la app
   (durante un rollout), el esquema debe servir para ambas.
4. **Una migración por deploy.** Menos superficie de fallo.
5. Las migraciones de la Fase 10 (bodegas) son de alto riesgo: agregar
   columnas y tablas nuevas es seguro; **backfill de stock y FKs con `NOT NULL`
   sobre tablas con datos requiere amenable por lotes**.

Ver también la sección de respaldo en
[`docs/upgrade-V2-Manejo-de-bodegas.md`](upgrade-V2-Manejo-de-bodegas.md).

---

## 5. Blue/green (solo si fuera necesario)

Para downtime realmente cero se levanta **dos stacks completos** con nombres
distintos y un proxy delante que cambia el upstream:

```
proxy  ->  stack-blue  (versión actual)
       ->  stack-green (versión nueva, en espera)
```

Se despliega en `green`, se espera su healthcheck, se cambia el upstream del
proxy (recarga, sin cortar conexiones) y `blue` queda en espera para
rollback. Costo: doble de disco y más complejidad operativa. **No se justifica
aún** con ~20 usuarios; documentado para cuando el sistema sea crítico.

---

## 6. Verificación post-despliegue (CLI)

```bash
# Estado de los servicios
docker compose ps

# ¿El frontend responde?
curl -sI http://localhost:8081/ | grep -i cache-control
# esperado: Cache-Control: no-cache, must-revalidate

curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8081/          # 200

# ¿Un asset inexistente da 404? (detecta fallback SPA mal configurado)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8081/assets/no-existe.js

# ¿El bundle nuevo realmente se está sirviendo?
docker compose exec -T frontend ls /usr/share/nginx/html/assets/

# ¿La API responde a través de nginx?
curl -s -X POST http://localhost:8081/api/auth/login \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/login.json
```

> **Trampa con el navegador:** si la app ya estaba abierta, una recarga normal
> puede servir el bundle viejo desde memoria. Usar **Ctrl+Shift+R** (recarga
> sin caché). `index.html` ya se sirve con `no-cache`, pero la pestaña abierta
> sigue ejecutando el JavaScript anterior hasta que se recarga.

### Autenticarse por CLI

Al pasar el JSON por SSH, las comillas dobles se pierden (el shell remoto las
elimina) y el backend responde `400 Formato de JSON inválido`. **Es un artefacto
del escapado, no un fallo de la app.** Solución: mandar el payload en base64.

```powershell
$json  = '{"email":"admin@inventario.com","password":"..."}'
$b64   = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
$remote = "echo $b64 | base64 -d > /tmp/login.json && curl -s -X POST http://localhost:8081/api/auth/login -H 'Content-Type: application/json' --data-binary @/tmp/login.json"
ssh usuario@servidor $remote
```

Lo mismo aplica a `psql`: enviar el SQL en base64 para evitar que los paréntesis
y las comillas se interpreten.

---

## 7. Checklist antes de cada despliegue en producción

- [ ] Tests pasan (frontend `npm test`, backend `scripts/test_backend.sh`).
- [ ] `npm run build` sin errores.
- [ ] **Respaldo de la base de datos** si el cambio toca migraciones.
- [ ] Migraciones *expand/contract*, una por deploy.
- [ ] Se despliega con **tag inmutable**, nunca `latest`.
- [ ] `docker compose ps` muestra los tres servicios `Up`.
- [ ] `/` responde `200` y el bundle nuevo está en `assets/`.
- [ ] API responde a través de nginx.
- [ ] Etiqueta de versión aplicada (`git tag -a vX.Y.Z -m "..."`).
- [ ] Plan de rollback|Ver §3.3.

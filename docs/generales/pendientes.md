# Pendientes a ejecutar

**Última actualización:** 2026-10-20
**Motivo de este documento:** cierre de sesión con el historial respaldado en el
remoto y la máquina de trabajo a punto de formatearse. Aquí queda la lista viva
de lo que falta, con los comandos concretos para retomarlo sin contexto previo.

> Estado de referencia revisado: `desa` y `origin/desa` en `41bf0c8`; `origin/deploy-local`
> en `f640fe5`. La rama local `deploy-local` sigue ese remoto y contiene la integración
> selectiva validada; el push aún está pendiente. Sin CI/CD: el despliegue es manual.

---

## 0. Resguardo antes de formatear (crítico)

El código ya está a salvo en el remoto: `desa`, `deploy-local`, `master`,
`feat/inactivar-logico`, `integrate-desa` y `respaldo/pre-formateo-2026-10-12`
(`92e86ff`, snapshot literal del worktree bloqueado). **Lo que NO está en git y
se pierde al formatear:**

- [ ] `.env` de la **raíz del servidor**: `JWT_SECRET`, `DB_PASSWORD`,
      `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MAIL_USERNAME`, `MAIL_PASSWORD`.
      Sin esos valores hay que regenerar el secreto JWT, la clave de BD y los
      correos; no hay copia en el repositorio porque son secretos.
- [ ] `tunnel-local/.env` (credenciales del túnel de Cloudflare).
- [ ] `~/.ssh/config` del equipo cliente (alias `siges`) y
      `~/.ssh/authorized_keys` del servidor.
- [ ] Respaldo de PostgreSQL y de la NAS (cron diario a las 23:00,
      `scripts/backup_nas.sh`) por si el formateo toca el servidor.
- [ ] Dump puntual previo al formateo:
      `docker exec <db> pg_dump -U <user> <db> > respaldo_$(date +%F).sql`

---

## 1. Servidor: desplegar la versión actual (bloqueante)

El servidor quedó en `1c3dcb1`; falta subir `f640fe5` y reconstruir. `git pull`
por sí solo **no** reconstruye imágenes, y la migración `V9` (columna
`presentations.activo`) corre al arrancar el backend.

```bash
cd ~/gestion-inventario-sprinReact      # ruta real del clon en el servidor
git pull                               # debe llegar a f640fe5
# agregar al .env de la raíz (una sola vez):
#   SERVER_IP=192.168.200.26
#   APP_PUERTO=8081
#   API_PUERTO=8080
./deploy.sh                            # docker compose up -d --build
```

- [ ] Verificar que Flyway aplicó V9:
      `docker compose -f docker-compose.prod.yml logs backend | grep -i flyway`
      (o consultar `flyway_schema_history`, la última fila debe ser `version 9`).
- [ ] Abrir `http://<SERVER_IP>:8081`, iniciar sesión y confirmar que el catálogo
      muestra el badge **Inactiva** y las acciones Activar/Inactivar.
- [ ] Si el frontend sale viejo pese al build:
      `docker compose -f docker-compose.prod.yml build frontend --no-cache && docker compose -f docker-compose.prod.yml up -d frontend`

---

## 2. Acceso SSH desde la máquina formateada

- [ ] Rehacer `~/.ssh/config` en la máquina nueva (tras formatear se pierde):

  ```text
  Host siges
      HostName 192.168.200.26      # la IP la entrega el DHCP; revisar con `hostname -I`
      User ubuntu                  # confirmar el usuario real del servidor
      IdentityFile ~/.ssh/id_ed25519
      HostKeyAlias siges           # evita el "host key changed" al reciclar la IP
      ServerAliveInterval 30
  ```

- [ ] Autorizar la clave pública en el servidor (el usuario `ubuntu` todavía la
      rechaza; la clave quedó sin instalar en el `authorized_keys` del usuario
      correcto):

  ```bash
  K='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBRdhQlY+B50HkuLDpTWdahJzICdE0L5C7jsiqC6+zQK carlosorozcok@gmail.com'
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  grep -qF "$K" ~/.ssh/authorized_keys 2>/dev/null || echo "$K" >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys && chown -R "$(whoami):$(whoami)" ~/.ssh
  ssh-keygen -l -f ~/.ssh/authorized_keys   # debe imprimir SHA256:SnUc8AlWQd3/yiMzoGJD/CUxnCAYICw17a8CsVZynzg
  ```

- [ ] Confirmar la huella del servidor antes de aceptarla:
      `ssh-ed25519 SHA256:7l97rMSE1Qr9PvINFA7KGL2klO71D2aB4tokMXpaLsQ`
      (ya verificada el 2026-10-12 contra la entrada de `known_hosts`).

---

## 3. Decisión abierta: `docs/MEJORAS_IMPLEMENTACIONES.md`

Hay **dos versiones divergentes** y hay que elegir una:

- La de `origin/desa`: incluye la sección *"14. QR impreso externamente:
  nomenclatura `SIGES-PRES-{id}`"* (nota de un 404 en producción, 2026-09-30).
- La guardada en `respaldo/pre-formateo-2026-10-12`: reordena las secciones
  14-16 (tiempo real, permisos de reportería, recuperación de contraseña) y
  **retira** la sección del QR.

- [ ] Diff completo: `git diff origin/desa respaldo/pre-formateo-2026-10-12 -- docs/MEJORAS_IMPLEMENTACIONES.md`
- [ ] Decidir cuál gana y borrar la rama `respaldo/...` cuando ya no haga falta.

---

## 4. Backend / seguridad

- [ ] **Endurecer `/ws/auditoria`**: el endpoint WebSocket sigue en `permitAll`
      en la configuración de seguridad. Requiere exigir autenticación (JWT en el
      handshake) para que solo `ADMIN`/`JEFE` reciban los eventos en vivo.
- [ ] **BOM UTF-8** en archivos del frontend (pospuesto): limpiar los `\uFEFF`
      iniciales que aparecen en algunos ficheros.

---

## 5. Fase 10 — Bodegas / separación por departamento

Diseño aprobado, implementación **no iniciada**. Referencias:
`docs/upgrade-V2-Manejo-de-bodegas.md` y `AGENTS.md` §8.

- [ ] Entidad `Bodega` + relación con `User`/`Item` y **aislamiento por bodega**
      (que un usuario solo vea el stock de la suya; `ADMIN` ve todas).
- [ ] `stock_reservado`: reservar unidades en préstamos, con
      `disponible = stock - stock_reservado` en la vista del catálogo.
- [ ] Motor de **préstamos entre bodegas** y su **máquina de estados**
      (solicitado / aprobado / en tránsito / recibido / rechazado).
- [ ] **Topes anti-enjuague** (límites de movimiento por rol/bodega).
- [ ] QR por bodega y **migración `V10`** de datos existentes.
- [ ] UI: pantalla de bodegas, transferencias y badges de stock reservado.

Decisiones abiertas a cerrar antes de empezar (están en el doc de upgrade):
stock por bodega vs presentación única, formato del QR por bodega y estrategia
de migración de datos.

---

## 6. Entornos `pre` y `pro`

Ambos apuntan a `cc0426b` (anterior a Fase 9). Falta promover la versión actual.

- [ ] Definir la política de promoción (¿`desa` → `pre` → `pro` por merge?).
- [ ] Ejecutar la promoción y desplegar en cada entorno.

---

## 7. Verificación E2E

- [ ] Ejecutar `scripts/smoke_test_e2e.py` contra un entorno de pruebas.
- [ ] **Nunca** correr `scripts/limpiar_e2e.sql` en el servidor con datos reales:
      hace `DELETE FROM audit_logs` y borraría la trazabilidad de producción.
      Usarlo solo en entornos de prueba o tras un `pg_dump`.

---

## 8. Limpieza y deuda menor

- [ ] `scripts/test_permisos.sh` existe solo en `deploy-local`; decidir si se
      sube a `desa` (necesita `jq`, no disponible en el equipo local).
- [ ] Borrar la rama `respaldo/pre-formateo-2026-10-12` una vez cerrada la
      decisión de la sección 3.
- [ ] `frontend/src/utils/__prueba.tmp` (archivo basura de 1 byte) quedó
      registrado únicamente en la rama de respaldo; no reintroducirlo.
- [ ] Los worktrees temporales (`w2`, `w2-desa`, `wt-dl`) desaparecen al
      formatear; no contienen nada que no esté ya en el remoto.
- [ ] El worktree principal del equipo quedó con **ACLs rotas** ("Acceso
      denegado" sobre archivos existentes, por un sandbox de `codex`); al
      formatear se resuelve, pero conviene revisar si algún archivo quedó
      inconsistente tras el clon nuevo.

## 9. Validación de seguridad del sitio web

Basado en lo existente: JWT stateless, BCrypt, CORS por patrones, validación con Bean Validation, @RestControllerAdvice, @Transactional, separación de .env (no versionado), HTTPS detrás de Caddy. Usar las skills existentes: deploy-docker, validacion-e2e y seguir estándares del stack.

### Pre-despliegue (local/CI)
- [ ] Ejecutar tests backend (scripts/test_backend.sh) y frontend (npm test) verdes.
- [ ] Build frontend (npm run build) sin warnings críticos.
- [ ] Revisar dependencias: npm audit --production (frontend) y análisis con herramientas disponibles. Registrar hallazgos.
- [ ] Confirmar .env no está versionado (.gitignore). Verificar secrets no hardcodeados (grep ADMIN_EMAIL/PASSWORD fuera de .env.example; revisar JwtUtil, DataSeeder).
- [ ] Validar configuración de seguridad: revisar rutas permitidas en SecurityConfig, que /api/auth/** y /ws/** sean las únicas públicas según necesidad; plantear endurecer /ws/auditoria.

### Despliegue/Runtime
- [ ] Verificar que la app solo escucha por 8080 interno (nginx/Caddy). No exponer 8080/5432 públicamente.
- [ ] Comprobar headers de seguridad en producción (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options). Si falta, documentar propuestas sin romper QR/WS.
- [ ] CORS: validar allowedOriginPatterns incluye solo dominios autorizados.
- [ ] Tokens: JWT con expiración, uso de Bearer, logout efectivo. Revisar rotación si hay cambios de secret.
- [ ] Rate limiting/brute force para /api/auth/login (evaluar si aplicar). Registrar decisión.
- [ ] SSL/TLS válido (Caddy automático). Forzar HTTPS.

### Validación funcional y evidencias
- [ ] Smoke test E2E (skill validacion-e2e) contra entorno objetivo.
- [ ] Verificación post-deploy (scripts/verify_*.sh) si aplica.
- [ ] Revisar logs de backend (errores 401/403 esperados, sin stacktraces en respuestas).
- [ ] Registrar checklist ejecutado con fecha/resultado.

Referencias: AGENTS.md, docs/despliegue/flujo_despliegue.md, docs/SEGURIDAD_CHECKLIST.md (a crear), skills/deploy-docker, skills/validacion-e2e.

## 10. Mejoras al Kárdex / Trazabilidad por producto

**Objetivo:** Unificar trazabilidad en un solo módulo (evitar adivinar entre Insumos/Reportes). Poder filtrar por insumo/presentación y ver saldo por movimiento.

### Backend
- [ ] **Filtro por producto:** agregar filtro `presentationId` y/o `itemId` a `/api/movimientos/paginado` (y mantener `/api/movimientos` completo para agregados).
- [ ] **Saldo acumulado (running balance):** calcular el saldo después de cada movimiento en el listado filtrado. Definir orden cronológico ascendente para el cálculo (o recalcular por historial completo) y exponerlo en `MovimientoResponseDTO` (ej. `balanceAfter`).
- [ ] **Permisos:** asegurar que AUXILIAR pueda filtrar y ver trazabilidad por producto (actualmente `/movimientos` ya es accesible).
- [ ] **Rendimiento:** para filtro por presentación, usar consulta con `EntityGraph` + paginación en servidor.

### Frontend
- [ ] **Buscador/filtro en Kárdex:** selector de insumo/presentación (o buscador con autocompletado). Al filtrar, mostrar solo movimientos de ese producto.
- [ ] **Columna "Saldo después":** añadir columna con el saldo acumulado tras cada movimiento.
- [ ] **Acceso desde Insumos:** botón/acción "Ver trazabilidad" en fila de presentación que abra Kárdex con el filtro pre-cargado (por `presentationId`).
- [ ] **UX clara:** mostrar stock actual del producto filtrado y resumen (entradas/salidas/ajustes neto).
- [ ] **Permisos UI:** asegurar que AUXILIAR vea el módulo con estas capacidades.

### Validación
- [ ] Probar con movimientos existentes (ENTRADA/SALIDA/AJUSTE_POSITIVO/AJUSTE_NEGATIVO).
- [ ] Verificar que el saldo cuadra con el stock actual en `presentations.stock`.
- [ ] Probar inactivos (no deben permitir movimientos, pero deben conservar trazabilidad histórica).

---

## 11. Continuidad de trabajo: ramas y pruebas

- [x] Completar la sincronización **selectiva** de aplicación desde `desa` hacia
      `deploy-local`, conservando intactos `deploy-local.sh`, `tunnel-local/`,
      `DESPLIEGUE_LOCAL_UBUNTU.md` y las configuraciones de servidor local. No
      hacer merge completo de `desa` ni de `deploy-local` hacia ramas de servidor.
- [x] Preparar la integración basada en `origin/deploy-local`; comparar archivos
      con `origin/desa`, portar cambios selectivos y validar tests/build antes de
      actualizar la rama local `deploy-local`.
- [ ] Revisar el tracking: `desa` coincide con `origin/desa`, pero no muestra
      upstream configurado; `origin/HEAD` sigue apuntando a `origin/master`.
      Confirmar la política antes de cambiar referencias.
- [x] Actualizar `frontend/src/pages/Movimientos.test.tsx` para probar el flujo
      vigente: tarjeta de Kárdex que navega a Reportes (la tabla paginada ya no
      pertenece a esta pantalla); suite completa frontend: 73 tests aprobados.
- [x] Corregir y validar el error de render en Trazabilidad por producto
      (`trazaTotal`/paginación indefinidos); probar búsqueda, saldo y paginación.

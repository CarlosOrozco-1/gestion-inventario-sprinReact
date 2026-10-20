# FLUJO DE DESPLIEGUE (desa → pre → pro)

> **Flujo de ambientes de SIGES.** Cada rama representa un entorno; el código
> viaja siempre en este orden: **desa → pre → pro**.
>
> `desa` = desarrollo · `pre` = pruebas/análisis y revisión · `pro` = producción.

---

## 1. Ambientes y ramas

| Rama | Entorno | Uso | ¿Se despliega en el servidor? |
|---|---|---|---|
| `desa` | Desarrollo | Toda funcionalidad nueva nace aquí. Desarrollo y pruebas locales. | Opcional (dev) |
| `pre` | Pre-producción | Análisis y revisión: se suben las funcionalidades de `desa` para probarlas "en serio" antes de producción. | Sí (deploy de pruebas) |
| `pro` | Producción | Solo código revisado y aprobado. Es lo que ve el usuario final. | Sí (deploy productivo) |

**Regla de oro:** ningún cambio se hace directo en `pre` o `pro`. Todo el código
nace en `desa` y se promueve hacia adelante (solo hay camino de ida). Los
hotfixes de emergencia se documentan aparte (ver §7).

---

## 2. Las 5 fases del ciclo

1. **Desarrollar en `desa`** — código, tests y build local en verde.
2. **Promover a `pre`** — merge `desa → pre` + push; deploy de pruebas en el servidor.
3. **Analizar y revisar en `pre`** — validar funcionalidad y regresiones.
4. **Promover a `pro`** — merge `pre → pro` + push; deploy productivo.
5. **Verificar producción** — smoke test y monitoreo del entorno real.

Si en cualquier fase se detecta un problema, se corrige en `desa` y se repite el
ciclo (no se corrige en `pre`/`pro`).

---

## 3. Fase 1 — Desarrollo en `desa`

**Local (máquina de desarrollo):**
```bash
git checkout desa
git pull origin desa            # sincronizar antes de empezar

# ... desarrollar y committear ...
git add -A
git commit -m "<mensaje descriptivo>"
git push origin desa
```

**Criterios de salida (todo must pass antes de promover):**
```bash
# Frontend: tests y build
cd frontend && npm test && npm run build

# Backend: tests (corre en Docker)
./scripts/test_backend.sh
```

---

## 4. Fase 2 — Promover a `pre` (deploy de pruebas)

**Local:**
```bash
git checkout pre
git pull origin pre
git merge desa                 # fast-forward si desa no divergió
git push origin pre
git checkout desa              # volver a la rama de trabajo
```

**Servidor (deploy de pruebas con `pre`):**
```bash
cd /home/ubuntu/gestionInventario/gestion-inventario-sprinReact
git fetch --prune origin
git checkout pre
git pull origin pre
sudo ./deploy.sh
```

> ⚠️ **Importante (ambiente compartido):** si el servidor aloja producción y
> pruebas en el mismo host con los mismos puertos, desplegar `pre` **reemplaza
> temporalmente** la app que corre (incluida producción). Los ambientes con
> coexistencia simultánea requieren puertos/subdominios distintos (ver §8).

---

## 5. Fase 3 — Análisis y revisión en `pre`

- Probar la funcionalidad completa (flujos, validaciones, auditoría).
- Opcional: correr el smoke test E2E (`scripts/smoke_test_e2e.py`) y limpiar
  datos (`scripts/limpiar_e2e.sql`).
- Si algo falla → **volver a `desa`**, corregir, y repetir Fase 2.
- Si todo es correcto → continuar a Fase 4.

---

## 6. Fase 4 — Promover a `pro` (producción)

**Local:**
```bash
git checkout pro
git pull origin pro
git merge pre
git push origin pro

# Etiquetar la versión despachada a producción
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
git checkout desa
```

**Servidor (deploy productivo con `pro`):**
```bash
cd /home/ubuntu/gestionInventario/gestion-inventario-sprinReact
git fetch --prune origin
git checkout pro
git pull origin pro
sudo ./deploy.sh
```

> Antes de desplegar en producción: **respaldo de PostgreSQL**
> (`docker exec -i <db-container> pg_dump -U inventario inventario > respaldo.sql`).
> Las migraciones Flyway son aditivas, pero el respaldo es el estándar.

---

## 7. Rollback y hotfixes

**Rollback:** si producción falla tras el deploy, volver a servir el commit anterior:
```bash
# (en el servidor, rama pro)
git checkout pro
git log --oneline -5           # identificar el commit anterior bueno
sudo git stash -u              # reservar cambios si estuvieran sucios
sudo git checkout <commit-anterior>
sudo ./deploy.sh
# Regresar a la rama con el fix una vez corregido:
sudo git checkout pro && sudo git pull origin pro && sudo ./deploy.sh
```

**Hotfix crítico (excepción documentada):**
1. Sacar la rama del commit de producción: `git checkout -b hotfix-xxx pro`.
2. Corregir, commitear y pushear.
3. Acto seguido llevar el fix **hacia atrás y hacia delante** para no perder el flujo:
   `desa ← pro` (merge del hotfix) y luego repetir las fases hacia `pre` y `pro`.

---

## 8. Nota: ambientes pre y pro en el mismo servidor

Un solo host puede atender ambos entornos **si no comparten puertos**:

- **Producción:** subdominio principal (p. ej. `gestioninventario.duckdns.org`)
  → puerto `8081` (compose actual).
- **Pruebas:** un **segundo subdominio** (p. ej. `pre.gestioninventario.duckdns.org`)
  → puerto `8082`, con un override de compose (p. ej.
  `docker compose -f docker-compose.prod.yml -f docker-compose.pre.yml up -d --build`
  cambiando el puerto publicado del frontend y el nombre del proyecto/volumen).

Si no se exige que ambos estén vivos a la vez, el flujo simple (desplegar la rama
activa sobre los puertos `8081`/`5432`) es suficiente y es el que usan los pasos
de arriba.

---

## 9. Checklist rápido antes de cada promoción

- [ ] `desa`: tests de frontend y backend en verde + build OK.
- [ ] `pre`: funcionalidad probada y revisada (smoke test sin datos residuales).
- [ ] `pro`: respaldo de BD tomado; migraciones Flyway aplicadas sin errores.
- [ ] Las 3 ramas alineadas (mismo commit base); tag de versión en `pro`.
- [ ] Logs de backend sin excepciones tras el deploy (`docker compose logs backend`).

---

## 10. Cómo mantener este documento al día

Este archivo vive en el repositorio (las 3 ramas), así que **se actualiza igual
que el código**: se modifica en `desa`, se promueve a `pre` y `pro`, y cada
servidor lo recibe con el `git pull` de su rama.
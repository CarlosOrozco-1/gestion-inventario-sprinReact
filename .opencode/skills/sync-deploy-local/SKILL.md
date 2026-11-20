---
name: sync-deploy-local
description: Usar cuando se pida sincronizar, portar o integrar cambios de `desa` hacia la rama `deploy-local` (servidor local). Aplica SOLO cambios de aplicación mediante cherry-pick selectivo, preservando intacta la infraestructura local (deploy-local.sh, tunnel-local/, DESPLIEGUE_LOCAL_UBUNTU.md, .env, puertos, CORS). Nunca hace merge completo de `desa` ni de `deploy-local` hacia desa/pre/pro.
---

# Sincronización selectiva: `desa` → `deploy-local` (SIGES)

`deploy-local` contiene infraestructura de servidor local (scripts, túnel
Cloudflare, IP en `.env`, puertos `8081`/`8080`). **Nunca** se hace merge
completo de `desa` hacia ella ni al revés. La integración es por cherry-pick
selectivo, siguiendo `docs/git/trabajo-git.md` ("Actualizar deploy-local
desde desa sin reemplazar su infraestructura").

## Reglas de protección (inviolables)
- **NO** hacer merge de `deploy-local` hacia `desa`, `pre` ni `pro`.
- **NO** hacer merge completo de `desa` hacia `deploy-local`.
- Portar **solo commits/hunks de aplicación** (backend, frontend, docs de
  producto). Nunca reemplazar `deploy-local.sh`, `tunnel-local/`,
  `DESPLIEGUE_LOCAL_UBUNTU.md`, `.env`, puertos ni CORS.
- Si un archivo mezcla lógica y entorno (CORS, `SecurityConfig`,
  `application-prod.properties`, `.env.example`, Compose), resolver por hunks y
  preservar los valores propios del servidor local.

## Procedimiento

### 1. Precondiciones
- Worktree limpio en `desa` (todo commiteado, pruebas pasando). Si hay cambios
  sin commit, **detenerse** y pedir autorización.
- `git fetch origin` (solo lectura).

### 2. Crear rama de integración basada en `deploy-local`
```bash
git switch desa
git switch --create integracion-deploy-local deploy-local
```
> Se parte de `deploy-local` (local) para conservar sus commits de integración
> previos no publicados. Si se quiere partir del remoto: usar
> `origin/deploy-local` y re-aplicar.

### 3. Revisar divergencia antes de portar
```bash
git merge-base deploy-local desa   # o origin/deploy-local
git diff --name-status deploy-local...desa
git diff --name-status desa...deploy-local
```
Confirmar que los archivos únicos de `deploy-local` son solo infraestructura
local (`tunnel-local/`, `deploy-local.sh`, `DESPLIEGUE_LOCAL_UBUNTU.md`).

### 4. Portar solo commits de aplicación
```bash
git cherry-pick <commit-de-desa>
```
- Cherry-pick **uno a uno**. Si hay conflicto, resolver preservando la config
  local y continuar con `git cherry-pick --continue`.
- Si un commit toca archivos mixtos (lógica + entorno), usar
  `git cherry-pick -n <commit>` y commitear solo los hunks de aplicación.

### 5. Validaciones obligatorias
- [ ] Siguen presentes `deploy-local.sh`, `tunnel-local/` y
      `DESPLIEGUE_LOCAL_UBUNTU.md`.
- [ ] Revisar `.env`/secretos, puertos (`8081` app, `8080` API), CORS y túnel.
- [ ] Backend: `scripts/test_backend.sh` → BUILD SUCCESSFUL.
- [ ] Frontend: `cd frontend && npm run lint && npm run build` OK.
- [ ] Revisar todo el diff de la rama temporal:
      `git diff deploy-local..integracion-deploy-local`.

### 6. Promover (solo tras validación explícita del usuario)
```bash
git switch deploy-local
git merge integracion-deploy-local
git branch -d integracion-deploy-local
```
- El push de `deploy-local` al remoto es decisión del usuario (decirlo
  explícitamente).

### 7. Si algo falla
```bash
git switch deploy-local
git branch -D integracion-deploy-local
```
`deploy-local` y `desa` quedan intactos.

## Detección de merge accidental desde `deploy-local`
Antes de cualquier merge a `pre`/`pro`:
```bash
git diff --name-only origin/desa..origin/deploy-local | grep -E 'tunnel-local/|deploy-local\.sh|DESPLIEGUE_LOCAL_UBUNTU\.md'
```
Si devuelve resultados, **estás por mergear config local**. Detener y usar
cherry-pick solo de los archivos de aplicación necesarios.

## Nota
- `backup` se mueve únicamente tras verificar `desa`; las promociones a
  `deploy-local` no mueven `backup`.
- Los tests del frontend se ejecutan con `npm test` (Vitest).
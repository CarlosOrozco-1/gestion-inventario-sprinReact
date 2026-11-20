---
name: trabajo-git
description: Usar cuando se pida trabajar con git, ramas, commits, push, merge, respaldo, integración de código de otros desarrolladores, promoción de releases (desa→pre→pro), o cuando haya dudas sobre el flujo de ramas, el respaldo `backup` o la protección de `deploy-local`. Resume y aplica las reglas de `docs/git/trabajo-git.md`.
---

# Trabajo con Git (SIGES)

Fuente de verdad: `docs/git/trabajo-git.md`. Esta skill resume las reglas para
no tener que repetirlas.

## Ramas
| Rama | Dónde vive | Función |
|---|---|---|
| `desa` | Remoto (upstream) | Rama principal de trabajo. La que se pushea. |
| `pre` | Remoto | Pre-producción. Solo código probado en `desa`. |
| `pro` | Remoto | Producción. Solo código probado en `pre`. |
| `backup` | **Solo local** | Respaldo del código verificado. Apunta siempre a un commit probado. |
| `integracion-*` | Solo local, temporal | Donde se baja y prueba código ajeno. Se borra al terminar. |
| `deploy-local` | Remoto | Config de servidor local (túnel, scripts, IP). **NO es producción.** |

## Regla de oro
**`backup` solo se adelanta cuando `desa` pasó las pruebas completas.** Nunca
se mergea hacia `backup`; se usa `git branch -f backup desa`.

## Protección de `deploy-local` (crítica)
- **NUNCA** hacer merge de `deploy-local` hacia `desa`, `pre` ni `pro`.
- `deploy-local` incluye `tunnel-local/`, `deploy-local.sh`,
  `DESPLIEGUE_LOCAL_UBUNTU.md`. Si `desa/pre/pro` los tienen → merge accidental.
- Comprobación antes de merge a `pre`/`pro`:
  ```bash
  git diff --name-only origin/desa..origin/deploy-local | grep -E 'tunnel-local/|deploy-local\.sh|DESPLIEGUE_LOCAL_UBUNTU\.md'
  ```
  Si devuelve resultados → detener.
- Integración de código de app desde `desa` a `deploy-local`: solo cherry-pick
  selectivo (ver skill `sync-deploy-local`).

## Flujo de integración de código ajeno
1. Preparar `desa`: todo commiteado y pruebas pasando.
2. Crear rama temporal:
   ```bash
   git switch desa
   git switch -c integracion-desa
   ```
3. Integrar ahí el código del desarrollador (merge/pull) y **probar**.
4. Si todo va bien:
   ```bash
   git switch desa
   git merge integracion-desa
   # probar de nuevo en desa
   git branch -f backup desa
   git branch -d integracion-desa
   git push
   ```
5. Si algo se rompe:
   ```bash
   git switch desa
   git branch -D integracion-desa
   ```
   `desa` y `backup` quedan intactos.

## Propagación de releases (en cascada, sin saltar etapas)
```
desa (pasa pruebas) ──merge──▶ pre (pasa pruebas) ──merge──▶ pro
```
- Promover `desa` → `pre`: rama temporal `integracion-pre`, merge `desa`,
  probar dos veces, merge a `pre`, push.
- Promover `pre` → `pro`: mismo patrón con `pro` como destino y `pre` como fuente.
- `pre`/`pro` nunca saltan estados. `backup` solo se mueve tras verificar `desa`.

## Detalles importantes
- `backup` no se sube al remoto. No hacer `git push backup`.
- Antes de avanzar `backup`, verificar que `desa` esté **commiteado** (un
  commit a la vez; `git branch -f` apunta a commits, no archivos).
- Conflictos no se evitan con ramas, se controlan: aislar en `integracion-*`.
- Flujo mental: `integracion-desa` (prueba) → `desa` (verificado) → `backup`
  (respaldo).

## Detalles de entorno
- El worktree principal puede tener ACLs rotas; al clonar de nuevo se resuelve.
- En PowerShell `git commit -F -` no funciona; pasar archivo de mensaje.
- Worktrees fuera del repo necesitan `-c safe.directory=<ruta>`.
- `ssh-keyscan` falla en Windows; `ssh` negocia `curve25519-sha256` sin problema.
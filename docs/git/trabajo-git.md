# Trabajo con Git: respaldo e integración sin romper nada

> Objetivo: integrar código de otros desarrolladores **sin romper** el trabajo
> local ni entrar en guerras de conflictos a ciegas. Se usan ramas para **aislar**
> y decidir *cuándo y si* entra el código ajeno.

## Ramas

| Rama | Dónde vive | Función |
|---|---|---|
| `desa` | Remoto (upstream) | Rama principal de trabajo. Es la que se pushea. |
| `pre` | Remoto (upstream) | Pre-producción. Avanza solo con código ya probado en `desa`. |
| `pro` | Remoto (upstream) | Producción. Avanza solo con código ya probado en `pre`. |
| `backup` | **Solo local** (no se sube) | Respaldo del código **verificado**. Apunta siempre a un commit probado. |
| `integracion-*` | Solo local, temporal | Donde se baja y se prueba el código de los demás. Se borra al terminar. |

Regla de oro: **`backup` solo se adelanta cuando `desa` pasó las pruebas
completas.** Nunca se mergea hacia `backup`; se usa `git branch -f`.

## Rama especial: `deploy-local`

| Rama | Dónde vive | Función |
|---|---|---|
| `deploy-local` | Remoto (upstream) | **NO es para producción.** Configuración específica del entorno local (túnel Cloudflare, `deploy-local.sh`, `tunnel-local/`, ajustes de `.env` para uso local). Contiene infraestructura/local, **no** lógica de negocio. |

**Regla de protección:** **NUNCA** hacer merge de `deploy-local` hacia `desa`, `pre` o `pro`. Si por error intentas hacerlo, **NO LO PERMITAS**. Las ramas de servidor (`desa/pre/pro`) solo deben recibir cambios de aplicación desde `desa` (y en cascada).

**Cómo detectar un merge accidental:**

- **Diferencia clave:** `deploy-local` incluye scripts/túnel/local (`tunnel-local/`, `deploy-local.sh`, `DESPLIEGUE_LOCAL_UBUNTU.md`), mientras que `desa/pre/pro` **no deben** tener esos archivos de configuración local.
- **Comprobación obligatoria antes de cualquier merge a `pre/pro`:**

  ```bash
  # Ver qué archivos únicos tiene deploy-local vs desa
  git diff --name-only origin/desa..origin/deploy-local | grep -E 'tunnel-local/|deploy-local\.sh|DESPLIEGUE_LOCAL_UBUNTU\.md'

  # Si devuelve resultados, ESTÁS POR MERGEAR CONFIG LOCAL. Deténlo.
  ```

- **Si detectas intento de merge desde `deploy-local` hacia `desa/pre/pro`:** cancélalo, aísla los cambios con `git cherry-pick` solo de los archivos de aplicación que realmente necesites (nunca todo el diff).

## Actualizar `deploy-local` desde `desa` sin reemplazar su infraestructura

`deploy-local` puede recibir lógica de aplicación probada en `desa`, pero no una
copia completa de su árbol: conserva sus scripts, túnel y configuración local.
La integración se hace en una rama temporal basada en el remoto de destino.

1. **Exigir un worktree limpio** y guardar/confirmar primero el trabajo de `desa`.
   No cambiar de rama con cambios sin commit ni aplicarles un stash sin autorización.
2. Actualizar referencias y crear la integración desde el destino:
   ```bash
   git fetch origin
   git switch --create integracion-deploy-local origin/deploy-local
   ```
3. Revisar la divergencia y el conjunto de archivos antes de copiar código:
   ```bash
   git merge-base origin/deploy-local origin/desa
   git diff --name-status origin/deploy-local...origin/desa
   git diff --name-status origin/desa...origin/deploy-local
   ```
4. Portar **solo commits o hunks de aplicación necesarios** desde `desa`.
   Cherry-pick únicamente commits que no reemplacen configuración local. Si un
   archivo mezcla lógica y entorno —por ejemplo CORS, `SecurityConfig`,
   `application-prod.properties`, `.env.example` o Compose— resolverlo por hunks
   y preservar los valores/nombres propios del servidor local.
5. Verificar que siguen presentes `deploy-local.sh`, `tunnel-local/` y
   `DESPLIEGUE_LOCAL_UBUNTU.md`; revisar `.env`/secretos, los puertos, CORS y el
   túnel. Ejecutar tests y build, y revisar todo el diff de la rama temporal.
6. Solo tras validación explícita, actualizar/pushear `deploy-local`. No promover
   esa rama a `desa`, `pre` ni `pro`. Si algo falla, descartar únicamente la rama
   temporal y conservar intactos los destinos.

## Flujo por cada integración de código ajeno

1. **Preparar `desa`:** todo el trabajo propio debe estar **commiteado** y las
   pruebas pasando. (Una rama respalda commits, no archivos sueltos).
2. **Crear la rama temporal:**
   ```bash
   git switch desa
   git switch -c integracion-desa
   ```
3. **Integrar ahí el código del desarrollador** (merge o pull del repo/rama) y
   **probar** en `integracion-desa`. Los conflictos se resuelven aquí, aislados.
4. **Si todo va bien:**
   ```bash
   git switch desa
   git merge integracion-desa      # integra lo probado
   # probar de nuevo en desa (regla: verificar dos veces)
   git branch -f backup desa       # respaldo avanza SOLO tras verificar
   git branch -d integracion-desa  # limpia la temporal
   git push                        # subir desa cuando corresponda
   ```
5. **Si algo se rompe:** el código ajeno vive solo en `integracion-desa`.
   ```bash
   git switch desa                 # desa y backup quedan intactos
   git branch -D integracion-desa  # descarta el código que rompió
   ```
   Se continúa desde `desa`/`backup` sin rastro del código malo.

## Detalles importantes

- **`backup` no se sube al remoto.** Si alguien intentara `git push backup`, debe
  abstenerse; es un respaldo local intencional.
- Antes de avanzar `backup`, verificar que el commit de `desa` esté **commiteado**
  (un commit a la vez; `git branch -f` apunta a commits, no a archivos).
- Los **conflictos no se evitan con ramas, se controlan**: aislar el código ajeno
  en `integracion-*` hace que tú decidas cuándo y si mergea, sin exponer jamás el
  respaldo verificado.
- Flujo mental de cada ciclo: **`integracion-desa` (prueba) → `desa` (verificado)
  → `backup` (respaldo)**.

## Propagación de releases (desa → pre → pro)

Los releases avanzan **en cascada**, sin saltar etapas:

```
desa (pasa pruebas) ──merge──▶ pre (pasa pruebas) ──merge──▶ pro
```

1. **Promover `desa` → `pre`:** con `desa` verificado, llevar `pre` al día y
   traer lo probado vía rama temporal:
   ```bash
   git switch pre
   git fetch origin && git merge origin/pre   # pre al día con el remoto
   git switch -c integracion-pre              # separar la promoción
   git merge desa                             # traer lo ya probado en desa
   # PROBAR en integracion-pre (dos verificaciones antes de tocar pre)
   git switch pre
   git merge integracion-pre
   # probar en pre nuevamente
   git branch -d integracion-pre
   git push
   ```
2. **Promover `pre` → `pro`:** repetir el mismo patrón usando `pro` como destino
   y `pre` como fuente (solo código ya probado en `pre`).
3. `pre`/`pro` **nunca** saltan estados: no se mergea `desa` directo a `pro`.
4. `backup` se mueve únicamente tras verificar `desa`; las promociones a `pre`
   y `pro` no mueven `backup`.
#!/usr/bin/env python3
"""
Smoke test E2E de flujos completos (Fase 6).

Ejecuta contra la API del backend (http://localhost:8080/api) los flujos
principales del sistema y reporta PASS/FAIL. No requiere dependencias
externas (usa urllib de la stdlib).

Uso:
    python3 scripts/smoke_test_e2e.py [BASE_URL]

Los datos de prueba (usuarios/insumos/movimientos) quedan marcados con el
sufijo "-e2e" para poder limpiarlos después con:
    docker compose -f docker-compose.prod.yml exec db psql -U inventario -d inventario -f scripts/limpiar_e2e.sql
"""
import json
import sys
import time
import urllib.request
import urllib.error

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080/api"

SUF = str(int(time.time()))[-6:]  # sufijo por ejecución -> script idempotente

passed = 0
failed = 0
failures = []


def request(method, path, token=None, body=None, expect=200):
    global passed, failed
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.getcode()
            raw = resp.read()
    except urllib.error.HTTPError as e:
        status = e.code
        raw = e.read()
    ok = status == expect
    if ok:
        passed += 1
        print(f"  PASS {method:4} {path} -> {status}")
    else:
        failed += 1
        text = raw[:200].decode(errors="replace")
        failures.append(f"{method} {path}: esperaba {expect}, obtuve {status}: {text}")
        print(f"  FAIL {method:4} {path} -> {status} (esperaba {expect}) {text[:120]}")
    try:
        return json.loads(raw.decode()) if raw else None
    except (UnicodeDecodeError, json.JSONDecodeError):
        return raw  # respuesta binaria (xlsx/pdf)


def check(name, cond):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS {name}")
    else:
        failed += 1
        failures.append(name)
        print(f"  FAIL {name}")


def main():
    print(f"\n=== E2E FLUJOS COMPLETOS (base: {BASE}) ===\n")

    print("[1] Autenticación")
    admin = request("POST", "/auth/login", body={"email": "admin@inventario.com", "password": "admin123"})
    admin_tok = admin["token"]
    check("login admin devuelve rol ADMIN", admin["user"]["rol"] == "ADMIN")

    print("\n[2] Gestión de usuarios")
    jefe = request("POST", "/usuarios/admin", admin_tok, {"name": "Jefa E2E", "email": f"jefe-e2e-{SUF}@inventario.com", "password": "123456", "rol": "JEFE"}, 200)
    aux = request("POST", "/usuarios/admin", admin_tok, {"name": "Aux E2E", "email": f"aux-e2e-{SUF}@inventario.com", "password": "123456", "rol": "AUXILIAR"}, 200)
    jefe_id, aux_id = jefe["id"], aux["id"]
    check("se crearon jefe y auxiliar", jefe["rol"]["name"] == "JEFE" and aux["rol"]["name"] == "AUXILIAR")

    jefe_login = request("POST", "/auth/login", body={"email": f"jefe-e2e-{SUF}@inventario.com", "password": "123456"})
    aux_login = request("POST", "/auth/login", body={"email": f"aux-e2e-{SUF}@inventario.com", "password": "123456"})
    jefe_tok, aux_tok = jefe_login["token"], aux_login["token"]

    # Update name/email (corrección de nombre tipo "Maria" -> "Marhia")
    request("PUT", f"/usuarios/admin/{jefe_id}", admin_tok, {"name": "Marhia E2E", "email": f"jefe-e2e-{SUF}@inventario.com"})
    jefe_act = request("GET", "/usuarios/admin", admin_tok)
    check("el nombre editado se refleja en el listado", any(u["id"] == jefe_id and u["name"] == "Marhia E2E" for u in jefe_act))
    # Email duplicado -> 400
    request("PUT", f"/usuarios/admin/{aux_id}", admin_tok, {"name": "Aux E2E", "email": "admin@inventario.com"}, 400)
    # Cambio de rol
    request("PUT", f"/usuarios/admin/{jefe_id}/rol", admin_tok, {"rol": "AUXILIAR"})
    jefe_act = request("GET", "/usuarios/admin", admin_tok)
    check("cambio de rol JEFE->AUXILIAR aplicado", any(u["id"] == jefe_id and u["rol"]["name"] == "AUXILIAR" for u in jefe_act))
    request("PUT", f"/usuarios/admin/{jefe_id}/rol", admin_tok, {"rol": "JEFE"})
    # Suspend/activate
    request("PUT", f"/usuarios/admin/{aux_id}/status", admin_tok, {"active": False})
    jefe_act = request("GET", "/usuarios/admin", admin_tok)
    check("suspender usuario active=false", any(u["id"] == aux_id and not u["active"] for u in jefe_act))
    request("PUT", f"/usuarios/admin/{aux_id}/status", admin_tok, {"active": True})
    # Auto-protección del admin
    request("PUT", f"/usuarios/admin/1/status", admin_tok, {"active": False}, 400)
    request("PUT", f"/usuarios/admin/1/rol", admin_tok, {"rol": "JEFE"}, 400)

    print("\n[3] Insumos (solo ADMIN crea/edita) — items + presentations")
    # Crear Gasa E2E con una presentación (variante)
    ins_a = request("POST", "/items", admin_tok, {"code": 99001, "name": f"Gasa E2E {SUF}", "presentations": [{"name": "Caja", "size": "10x10", "minStock": 10, "maxStock": 50, "estimatedCost": 25.00}]})
    ins_b = request("POST", "/items", admin_tok, {"code": 99002, "name": f"Jeringa E2E {SUF}", "presentations": [{"name": "Unidad", "size": "5ml", "minStock": 5, "maxStock": 100, "estimatedCost": 10.00}]})
    a_item_id, b_item_id = ins_a["id"], ins_b["id"]
    check("materiales E2E creados", a_item_id and b_item_id)
    a_id = ins_a["presentations"][0]["id"]
    b_id = ins_b["presentations"][0]["id"]
    # Agregar una segunda presentación a Gasa (variante)
    pres_c = request("POST", f"/items/{a_item_id}/presentations", admin_tok, {"name": "Rollo", "size": "10m", "minStock": 3, "maxStock": 15, "estimatedCost": 40.00})
    check("presentación adicional agregada", pres_c and pres_c["id"])
    # Editar la presentación (mín/máx/costo)
    request("PUT", f"/presentations/{a_id}", admin_tok, {"name": "Caja", "size": "10x10", "minStock": 20, "maxStock": 60, "estimatedCost": 30.00})
    ins = request("GET", "/insumos", admin_tok)
    a = next(x for x in ins if x["id"] == a_id)
    check("edición de minStock/costo aplicada", a["minStock"] == 20 and float(a["estimatedCost"]) == 30.0)
    # Permisos: aux no puede crear materiales
    request("POST", "/items", aux_tok, {"code": 99003, "name": "X E2E", "presentations": [{"name": "U", "size": "U"}]}, 403)

    print("\n[3.1] Códigos QR en presentaciones (Fase 20-21)")
    ins = request("GET", "/insumos", admin_tok)
    a = next(x for x in ins if x["id"] == a_id)
    check("cada presentación trae un qrCode autogenerado", bool(a.get("qrCode")))
    check("el qrCode sigue el formato SIGES-ITEM-<code>-PRES-<id>", str(a["qrCode"]).startswith("SIGES-ITEM-"))
    # Búsqueda por QR (Fases 22-23: escáner)
    byqr = request("GET", f"/presentations/qr/{a['qrCode']}", admin_tok)
    check("búsqueda por QR devuelve la presentación", byqr and byqr["id"] == a_id and byqr["presentation"] == "Caja")
    # QR inexistente -> 404
    request("GET", "/presentations/qr/NO-EXISTE-999", admin_tok, expect=404)

    print("\n[4] Motor transaccional (movimientos)")
    m1 = request("POST", "/movimientos", jefe_tok, {"presentationId": a_id, "type": "ENTRADA", "quantity": 20, "detail": "Compra E2E", "usuarioId": jefe_id})
    check("ENTRADA 20 registrada", m1 and m1["quantity"] == 20)
    ins = request("GET", "/insumos", admin_tok)
    a = next(x for x in ins if x["id"] == a_id)
    check("stock 0+20=20 tras entrada", a["stock"] == 20)
    request("POST", "/movimientos", jefe_tok, {"presentationId": a_id, "type": "SALIDA", "quantity": 8, "detail": "Uso E2E", "usuarioId": jefe_id})
    ins = request("GET", "/insumos", admin_tok)
    a = next(x for x in ins if x["id"] == a_id)
    check("stock 20-8=12 tras salida", a["stock"] == 12)
    # Salida excesiva -> 422
    request("POST", "/movimientos", jefe_tok, {"presentationId": a_id, "type": "SALIDA", "quantity": 999, "detail": "Exceso E2E", "usuarioId": jefe_id}, 422)
    # Entrada inválida (0) -> 400
    request("POST", "/movimientos", jefe_tok, {"presentationId": a_id, "type": "ENTRADA", "quantity": 0, "detail": "Cero E2E", "usuarioId": jefe_id}, 400)
    # Ajuste sin justificación -> 400
    request("POST", "/movimientos", jefe_tok, {"presentationId": a_id, "type": "AJUSTE_NEGATIVO", "quantity": 2, "detail": "Corto", "usuarioId": jefe_id}, 400)
    # Ajuste con justificación -> 200
    request("POST", "/movimientos", jefe_tok, {"presentationId": a_id, "type": "AJUSTE_NEGATIVO", "quantity": 2, "detail": "Ajuste por merma verificado en inventario", "usuarioId": jefe_id})
    ins = request("GET", "/insumos", admin_tok)
    a = next(x for x in ins if x["id"] == a_id)
    check("stock 12-2=10 tras ajuste negativo", a["stock"] == 10)
    movs = request("GET", "/movimientos", admin_tok)
    check("listado de movimientos incluye los E2E", any(m["itemName"] == f"Gasa E2E {SUF}" for m in movs))

    print("\n[5] Control de acceso por rol")
    request("GET", "/usuarios/admin", aux_tok, expect=403)
    request("GET", "/usuarios/admin", jefe_tok, expect=403)
    request("GET", "/insumos", aux_tok, expect=200)
    request("GET", "/insumos", None, expect=401)
    request("GET", "/insumos", "token-invalido", expect=401)

    print("\n[6] Reportería (Excel / PDF / Proyecciones)")
    ids = [m["id"] for m in movs[:5]]
    r = request("POST", "/reportes/excel", admin_tok, ids)
    check("Excel de movimientos generado (binario)", isinstance(r, bytes) or isinstance(r, str))
    r = request("POST", "/reportes/pdf", admin_tok, ids)
    check("PDF de movimientos generado (binario)", isinstance(r, bytes) or isinstance(r, str))
    proys = [{"item": "Gasa E2E", "stock": 10, "minStock": 20, "maxStock": 60, "estimatedCost": 30.0, "deficit": 50, "requiredInvestment": 1500.0, "urgency": "Alta"},
             {"item": "Jeringa E2E", "stock": 5, "minStock": 5, "maxStock": 100, "estimatedCost": 10.0, "deficit": 95, "requiredInvestment": 950.0, "urgency": "Alta"}]
    r = request("POST", "/reportes/proyecciones/excel", admin_tok, proys)
    check("Excel de proyecciones generado (binario)", isinstance(r, bytes) or isinstance(r, str))
    r = request("POST", "/reportes/proyecciones/pdf", admin_tok, proys)
    check("PDF de proyecciones generado (binario)", isinstance(r, bytes) or isinstance(r, str))

    print(f"\n=== RESUMEN: {passed} PASS, {failed} FAIL ===\n")
    if failures:
        print("Fallos:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Migra los datos de una base SQLite a PostgreSQL generando un script SQL.

Genera un archivo .sql con sentencias INSERT en el orden correcto de las
claves foráneas, restablece las secuencias para que los futuros IDs no
colisionen (importante con GenerationType.IDENTITY) y convierte los
timestamps (que en SQLite se guardaron como epoch en milisegundos) al
formato que PostgreSQL espera en columnas `timestamp`.

Uso:
    python3 scripts/migrar_sqlite_a_postgres.py [BD_SQLITE] [SALIDA_SQL]

    BD_SQLITE  : ruta del archivo .db  (default: backend/data/inventario.db)
    SALIDA_SQL : ruta del .sql generado (default: backend/data/migracion_postgres.sql)

Aplicar el resultado en PostgreSQL:
    psql -U inventario -h <host> -d inventario -f <SALIDA_SQL>
"""

import sys
import sqlite3
from datetime import datetime

# Orden de importación respetando las claves foráneas.
TABLAS_EN_ORDEN = [
    "roles",                             # sin FK
    "usuarios",                          # FK -> roles(id)
    "inventario_insumos",                # sin FK
    "inventario_saldos_mensuales",       # FK -> inventario_insumos(id)
    "inventario_requerimientos_anuales", # FK -> inventario_insumos(id)
    "inventario_movimientos",            # FK -> inventario_insumos(id), usuarios(id)
]

TIPOS_TIMESTAMP = ("timestamp", "datetime")
TIPOS_BOOLEAN = ("boolean", "bool")


def valor_sql(valor, es_boolean: bool = False, es_timestamp: bool = False) -> str:
    """Convierte un valor de Python a un literal SQL compatible con PostgreSQL."""
    if valor is None:
        return "NULL"
    if es_boolean:
        # SQLite almacena booleanos como 0/1 (INTEGER)
        return "true" if int(valor) == 1 else "false"
    if es_timestamp:
        # En SQLite estos valores quedaron como epoch en milisegundos.
        if isinstance(valor, (int, float)):
            ts = datetime.fromtimestamp(float(valor) / 1000.0)
        else:
            ts = datetime.fromisoformat(str(valor))
        return "'" + ts.strftime("%Y-%m-%d %H:%M:%S") + "'"
    if isinstance(valor, bool):
        return "true" if valor else "false"
    if isinstance(valor, (int, float)):
        return str(valor)
    # str / fecha / texto: escapar comillas simples duplicándolas
    return "'" + str(valor).replace("'", "''") + "'"


def main() -> None:
    db_sqlite = sys.argv[1] if len(sys.argv) > 1 else "backend/data/inventario.db"
    salida_sql = sys.argv[2] if len(sys.argv) > 2 else "backend/data/migracion_postgres.sql"

    conn = sqlite3.connect(db_sqlite)
    cursor = conn.cursor()

    tipos_boolean = {}
    tipos_timestamp = {}
    for tabla in TABLAS_EN_ORDEN:
        cursor.execute(f'PRAGMA table_info("{tabla}")')
        for col in cursor.fetchall():
            tipo = col[2].lower()
            if tipo in TIPOS_BOOLEAN:
                tipos_boolean[(tabla, col[1])] = True
            elif tipo in TIPOS_TIMESTAMP:
                tipos_timestamp[(tabla, col[1])] = True

    sql = []
    sql.append("-- Generado por scripts/migrar_sqlite_a_postgres.py")
    sql.append("BEGIN;")
    sql.append("")

    for tabla in TABLAS_EN_ORDEN:
        cursor.execute(f'SELECT * FROM "{tabla}"')
        filas = cursor.fetchall()
        cursor.execute(f'PRAGMA table_info("{tabla}")')
        columnas = [c[1] for c in cursor.fetchall()]

        if not filas:
            sql.append(f"-- {tabla}: sin datos")
            sql.append("")
            continue

        columnas_sql = ", ".join(f'"{c}"' for c in columnas)
        for fila in filas:
            valores = ", ".join(
                valor_sql(
                    v,
                    es_boolean=tipos_boolean.get((tabla, c), False),
                    es_timestamp=tipos_timestamp.get((tabla, c), False),
                )
                for c, v in zip(columnas, fila)
            )
            sql.append(f'INSERT INTO "{tabla}" ({columnas_sql}) VALUES ({valores});')
        sql.append("")

        # Restablecer la secuencia de identidad tras insertar IDs explícitos.
        sql.append(
            f"SELECT setval(pg_get_serial_sequence('{tabla}', 'id'), "
            f"(SELECT COALESCE(MAX(id), 1) FROM \"{tabla}\"));"
        )
        sql.append("")

    sql.append("COMMIT;")
    contenido = "\n".join(sql)

    with open(salida_sql, "w", encoding="utf-8") as f:
        f.write(contenido + "\n")

    conn.close()
    print(f"[OK] Script generado: {salida_sql}")
    print(f"     Tablas: {', '.join(TABLAS_EN_ORDEN)}")


if __name__ == "__main__":
    main()
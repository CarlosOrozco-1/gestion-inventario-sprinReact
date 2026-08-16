# Flujo de Movimientos de Inventario

Flujo real para registrar movimientos (ENTRADA, SALIDA, REGULARIZACIÓN, CORRECCIÓN): selección de insumo, validación de stock y justificación, **confirmación modal ("¿Está seguro?")** y modal de respuesta con el stock resultante.

## 1. Diagrama de Flujo (General)

```mermaid
flowchart TD
    A([INICIO: Modulo de Movimientos]) --> B[Seleccionar el insumo]
    B --> C[Click: Registrar Movimiento]
    C --> D[Se abre MovimientoModal]

    D --> E[Seleccionar tipo de movimiento]

    E --> E1[ENTRADA]
    E --> E2[SALIDA]
    E --> E3[REGULARIZACION +/-]
    E --> E4[CORRECCION +/-]

    E1 --> F
    E2 --> F
    E3 --> F
    E4 --> F

    F[Ingresar cantidad y detalle/justificacion]

    F --> G{Justificacion cumple minimo?}
    G -->|"ENTRADA/SALIDA: 10 | REGULARIZACION: 20 | CORRECCION: 15"| H[Error: la justificacion debe tener al menos N caracteres]
    H --> F

    G -->|Cumple| I[Calcular stock resultante]
    I --> J[Mostrar modal de confirmacion:<br/>Cantidad | Stock actual | Stock resultante]
    J --> K{Usuario confirma: Esta seguro?}

    K -->|Cancelar| L[Se cierra el modal, no se guarda nada]
    L --> A

    K -->|Confirmar| M[POST /api/movimientos]
    M --> N{Validaciones Backend}

    N -->|Cantidad invalida / insumo no existe / stock insuficiente| O[Mostrar modal de error]
    O --> F

    N -->|Valido| P[Guardar movimiento + actualizar stock + saldo mensual + bitacora]
    P --> Q[Mostrar modal de exito<br/>Stock anterior -> Stock nuevo]
    Q --> R[Click: Aceptar]
    R --> S[Recargar lista de movimientos]
    S --> T([FIN])
```

## 2. Cálculo de Stock por Tipo

```mermaid
flowchart TD
    A([Movimiento aprobado]) --> B{Tipo de movimiento}

    B -->|ENTRADA| C[stock = stock + cantidad]
    B -->|SALIDA| D{Validar: stock >= cantidad}
    B -->|REGULARIZACION_POSITIVA / CORRECCION_POSITIVA| E[stock = stock + cantidad]
    B -->|REGULARIZACION_NEGATIVA / CORRECCION_NEGATIVA| F{Validar: stock >= cantidad}

    D -->|Si| G[stock = stock - cantidad]
    D -->|No| H[Error: Stock insuficiente]

    F -->|Si| I[stock = stock - cantidad]
    F -->|No| H

    C --> J[Actualizar saldo mensual del periodo]
    G --> J
    E --> J
    I --> J

    J --> K[Registrar movimiento en historial]
    K --> L[Registrar accion en bitacora]
    L --> M([FIN])

    style B fill:#e67e22,stroke:#d35400,color:#fff
    style H fill:#e74c3c,stroke:#c0392b,color:#fff
```

## 3. Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as MovimientoModal (React)
    participant C as MovimientoController (Spring)
    participant S as MovimientoService
    participant B as BitacoraService
    participant D as SQLite

    U->>F: Selecciona insumo + tipo + cantidad + detalle
    F->>F: Valida justificacion y calcula stock resultante
    F-->>U: ConfirmActionModal: "¿Está seguro del movimiento a realizar?"
    U->>F: Click: Confirmar
    F->>C: POST /api/movimientos { insumoId, tipo, usuarioId, cantidad, detalle }

    C->>S: procesarMovimiento()
    S->>D: Buscar insumo por id
    S->>S: Validar tipo, cantidad > 0 y justificacion
    S->>S: ENTRADA/+ -> sumar | SALIDA/- -> verificar stock
    S->>D: UPDATE insumo.stock
    S->>D: INSERT movimiento (historial)
    S->>S: Actualizar saldo mensual
    S->>B: registrar("MOVIMIENTO", movimientoId, usuario)
    B->>D: INSERT movimiento de bitacora
    C-->>F: 201 Movimiento registrado
    F-->>U: ResponseModal: éxito con stock anterior -> nuevo
    U->>F: Click: Aceptar
    F->>F: onSuccess() -> recarga movimientos + onClose()

    Note over F: Si el POST falla -> ResponseModal de error con el mensaje del backend
```

> **Nota:** los tipos REGULARIZACIÓN y CORRECCIÓN solo están disponibles para roles **ADMIN** y **JEFE** (el auxiliar solo registra ENTRADA y SALIDA).

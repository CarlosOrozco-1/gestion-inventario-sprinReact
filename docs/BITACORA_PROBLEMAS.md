# Bitácora de Problemas y Soluciones - Backend Spring Boot

Esta bitácora registra los obstáculos técnicos enfrentados durante la configuración inicial del proyecto y las decisiones arquitectónicas tomadas para resolverlos.

## 1. Conflicto de Versiones (Java 25 vs Gradle)
- **Problema:** El entorno local tenía instalado Java 25. Gradle 9.5.1 fallaba al intentar autodescargar Java 17 usando el plugin `foojay-resolver`. Al intentar usar Gradle 8.7, este no podía iniciar porque no soportaba Java 25 (`Unsupported class file major version 69`).
- **Solución:** Se retiró la restricción rígida de `toolchain` en `build.gradle`. Finalmente, se decidió migrar 100% a Docker para evitar problemas similares en las máquinas de los demás desarrolladores del equipo.

## 2. Incompatibilidad de Entorno (Falta de Compilador Java)
- **Problema:** Al intentar compilar localmente, surgió el error de que Java 25 no proveía capacidades de compilador (`[JAVA_COMPILER]`), indicando la ausencia del JDK (solo estaba el JRE).
- **Solución:** Implementar un `Dockerfile` multi-etapa utilizando la imagen oficial `gradle:8.7-jdk17`. Esto provee el JDK necesario dentro del contenedor de construcción (builder), sin exigirle instalaciones locales al equipo.

## 3. Error de Exclusión de Spring Security
- **Problema:** Se intentó desactivar la seguridad excluyendo `SecurityAutoConfiguration` en la clase principal, lo que provocó un error de compilación por la estructura moderna de paquetes de Spring Boot.
- **Solución:** Se creó una clase dedicada `SecurityConfig.java` utilizando el estándar `SecurityFilterChain` con la regla `permitAll()`. Es una solución elegante que facilita la posterior habilitación de JWT.

## 4. Error Crítico con Volumen Docker y SQLite
- **Problema:** El contenedor entraba en un bucle de reinicios. Esto se debió a que el archivo `docker-compose.yml` intentaba mapear el archivo `inventario.db`, el cual aún no existía en el Host. Como resultado, Docker creó una carpeta vacía llamada `inventario.db`, provocando que la aplicación fallara al intentar abrirla.
- **Solución:** Se actualizó `docker-compose.yml` para mapear un directorio contenedor (`/data`) y se modificó `application.properties` para apuntar a `jdbc:sqlite:./data/inventario.db`. De esta manera, SQLite crea el archivo de forma natural dentro de la carpeta mapeada.

## 5. ClassNotFoundException: SQLiteDialect no encontrado
- **Problema:** Al ejecutar el contenedor, la aplicación fallaba con `ClassNotFoundException: Could not load requested class: org.hibernate.dialect.SQLiteDialect`. Esto ocurre porque en Hibernate 7.x (usado por Spring Boot 4.1.0) la dialect de SQLite fue movida a un módulo separado `hibernate-community-dialects`, y la clase `org.hibernate.dialect.SQLiteDialect` ya no existe.
- **Solución:** Se agregó la dependencia `runtimeOnly 'org.hibernate.orm:hibernate-community-dialects'` en `build.gradle` y se actualizó `application.properties` con la ruta correcta: `spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect`.

## 6. Error SQLITE_CANTOPEN dentro del contenedor
- **Problema:** El contenedor fallaba con `[SQLITE_CANTOPEN] Unable to open the database file`. La URL JDBC usaba una ruta relativa (`./data/inventario.db`) que no resolvía correctamente dentro del contenedor Docker.
- **Solución:** Se cambió la URL JDBC a una ruta absoluta dentro del contenedor (`jdbc:sqlite:/app/data/inventario.db`), se agregó `RUN mkdir -p /app/data` en el `Dockerfile` para garantizar que el directorio exista antes de ejecutar la app, y se creó el directorio `backend/data` en el host para el mapeo del volumen. También se eliminó el atributo obsoleto `version` de `docker-compose.yml`.

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `backend/build.gradle` | Agregada dependencia `hibernate-community-dialects` |
| `backend/src/main/resources/application.properties` | Ruta JDBC absoluta + dialect correcto |
| `backend/Dockerfile` | Agregado `RUN mkdir -p /app/data` |
| `docker-compose.yml` | Eliminado atributo `version` obsoleto |

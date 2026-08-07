# Etapa 1: Compilación (imagen oficial de Gradle con Java 21)
# gradle 8.7 no soporta Spring Boot 4; usamos Gradle 9.5.1 (igual que el wrapper).
FROM gradle:9.5.1-jdk21 AS builder
WORKDIR /app
# Copiamos el código fuente y archivos de gradle al contenedor
COPY . .
# Ejecutamos la compilación ignorando los tests por ahora
RUN ./gradlew build -x test

# Etapa 2: Ejecución (Java 21 para coincidir con el objetivo de compilación)
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copiamos el archivo .jar generado en la Etapa 1
COPY --from=builder /app/build/libs/*.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]

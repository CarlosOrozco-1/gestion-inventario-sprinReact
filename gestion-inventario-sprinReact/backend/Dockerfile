# Etapa 1: Compilación (Usamos una imagen oficial de Gradle con Java 17)
FROM gradle:8.7-jdk17 AS builder
WORKDIR /app
# Copiamos el código fuente y archivos de gradle al contenedor
COPY . .
# Ejecutamos la compilación ignorando los tests por ahora
RUN chmod +x gradlew && ./gradlew build -x test

# Etapa 2: Ejecución (Usamos una imagen ligera de Java 17 solo para correr la app)
FROM eclipse-temurin:17-jre
WORKDIR /app
# Crear directorio para la base de datos SQLite
RUN mkdir -p /app/data
# Copiamos el archivo .jar generado en la Etapa 1
COPY --from=builder /app/build/libs/*.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]

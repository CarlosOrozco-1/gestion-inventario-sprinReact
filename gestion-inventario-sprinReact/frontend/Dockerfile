# Etapa 1: Compilación del frontend (Vite + React)
FROM node:20-alpine AS build
WORKDIR /app

# Copiamos los manifiestos y el lockfile para aprovechar la caché de capas
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código y compilamos
COPY . .

# URL base de la API. En producción se usa relativa (/api) para que Nginx/Caddy la proxyen.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

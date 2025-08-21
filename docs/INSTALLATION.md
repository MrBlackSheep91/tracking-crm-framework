# 🚀 Guía de Instalación del Framework

Esta guía describe cómo configurar el entorno de desarrollo completo para el **tracking-crm-framework**, incluyendo el backend y la base de datos.

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

-   **Node.js**: Versión 18.x o superior.
-   **Docker y Docker Compose**: Para ejecutar el entorno de desarrollo de forma aislada.

## 🛠️ Paso 1: Configuración del Backend

El backend es el corazón del sistema. Se encarga de recibir, procesar y almacenar todos los datos de tracking.

### 1. Clonar el Repositorio

Si aún no lo has hecho, clona el repositorio del proyecto en tu máquina local.

```bash
git clone https://github.com/innova-marketing/tracking-crm-framework.git innova-tracking-framework
cd innova-tracking-framework
```

### 2. Configurar Variables de Entorno

El backend utiliza un archivo `.env` para su configuración. Crea una copia del archivo de ejemplo.

```bash
# Navega al directorio del backend
cd backend/template

# Copia el archivo de ejemplo
cp .env.example .env
```

Ahora, abre el archivo `.env` y asegúrate de que las variables sean correctas para tu entorno local. Las variables por defecto suelen ser suficientes para empezar.

```env
# Puerto para la API
PORT=3001

# URL de conexión a la base de datos (debe coincidir con docker-compose.yml)
DATABASE_URL="postgresql://user:password@db:5432/tracking_crm?schema=public"

# Dominios permitidos para CORS (para desarrollo)
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# Otros secretos y configuraciones
JWT_SECRET="tu-secreto-jwt"
```

**Importante**: El `DATABASE_URL` usa `db` como hostname porque es el nombre del servicio de la base de datos dentro de la red de Docker.

### 3. Levantar los Servicios con Docker

Desde la raíz del proyecto (`innova-tracking-framework`), ejecuta Docker Compose para construir las imágenes y levantar los contenedores.

```bash
docker-compose up --build -d
```

-   `--build`: Reconstruye las imágenes si hay cambios en el `Dockerfile`.
-   `-d`: Ejecuta los contenedores en segundo plano (detached mode).

Este comando iniciará dos servicios:
1.  `db`: El contenedor de la base de datos PostgreSQL, accesible en el puerto `5433` de tu máquina local.
2.  `backend`: La API de Node.js, accesible en el puerto `3001`.

### 4. Aplicar Migraciones de la Base de Datos

Una vez que los contenedores estén en ejecución, necesitas aplicar el esquema de la base de datos usando Prisma.

```bash
# Ejecuta este comando dentro del contenedor del backend
docker-compose exec backend npm run db:migrate:deploy
```

### 5. Verificar la Instalación del Backend

Abre tu navegador o usa `curl` para comprobar que la API está funcionando correctamente.

```bash
curl http://localhost:3001/health
```

Deberías recibir una respuesta como esta:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected",
  "version": "2.0.0",
  "uptime": ...
}
```

¡Felicidades! El backend está instalado y funcionando.

## 🚀 Plan de Instalación Completo

Esta guía detalla el proceso completo para configurar, instalar y verificar el entorno de desarrollo del backend del Tracking CRM Framework.

### 1. Requisitos Previos

-   [Docker](https://www.docker.com/get-started) instalado y en ejecución.
-   [Node.js](https://nodejs.org/) (v18 o superior).
-   [Git](https://git-scm.com/) para control de versiones.
-   Un cliente de base de datos compatible con PostgreSQL (opcional, para verificación).

### 2. Configuración del Entorno de Desarrollo (Paso a Paso)

#### Paso 2.1: Clonar el Repositorio

Primero, clona el repositorio oficial desde GitHub a tu máquina local.

```bash
git clone https://github.com/MrBlackSheep91/tracking-crm-framework.git
cd tracking-crm-framework
```

#### Paso 2.2: Configurar Variables de Entorno

El sistema utiliza un archivo `.env` para gestionar las configuraciones. Copia la plantilla de ejemplo para crear tu propio archivo de configuración.

```bash
cp .env.template .env
```

**Importante:** Verifica que la variable `DATABASE_URL` en tu nuevo archivo `.env` coincida con las credenciales definidas en `docker-compose.yml` para asegurar la conexión.

```env
# Ejemplo de .env
DATABASE_URL="postgresql://user:password@localhost:5433/tracking_crm?schema=public"
```

#### Paso 2.3: Levantar los Servicios con Docker

Utiliza Docker Compose para construir las imágenes y orquestar los contenedores de la API y la base de datos. El flag `--build` asegura que se reconstruya la imagen si hay cambios, y `-d` lo ejecuta en segundo plano.

```bash
docker-compose up -d --build
```

#### Paso 2.4: Ejecutar las Migraciones de la Base de Datos

Con los contenedores ya en ejecución, es necesario aplicar el esquema de la base de datos. Este comando utiliza Prisma para sincronizar el esquema con tu instancia de PostgreSQL.

```bash
npx prisma migrate dev --name init
```

### 3. Verificación del Sistema

Una vez completados los pasos anteriores, el backend estará operativo en `http://localhost:3001`.

Para confirmar que la instalación fue exitosa, realiza una petición `GET` al endpoint de `health check`.

```bash
curl http://localhost:3001/health
```

Una respuesta exitosa confirmará que el servidor está saludable y conectado a la base de datos:

```json
{
  "status": "healthy",
  "timestamp": "2024-08-21T10:00:00.000Z",
  "database": "connected"
}
```

**¡Felicidades! El entorno de desarrollo del Tracking CRM Framework está listo para usarse.**

## 📦 Paso 2: Integración del Cliente Frontend

Con el backend listo, el siguiente paso es integrar el cliente de tracking en tu aplicación frontend.

El cliente se distribuye como un paquete de `npm`, por lo que la instalación es muy sencilla.

```bash
npm install @tracking-crm/client
```

Para obtener instrucciones detalladas sobre cómo inicializar y usar el tracker en tu proyecto (React, Vue, JS Vanilla), consulta nuestra **[Guía de Integración](./INTEGRATION.md)**.

## 🆘 Troubleshooting

-   **Error de conexión a la base de datos**: Verifica que el contenedor de `db` esté corriendo (`docker ps`). Asegúrate de que las credenciales en `DATABASE_URL` coincidan con las de `docker-compose.yml`.
-   **Puerto `3001` o `5433` ocupado**: Detén cualquier otro servicio que esté usando esos puertos o cámbialos en `docker-compose.yml` y en tu archivo `.env`.
-   **Comando `docker-compose exec` falla**: Asegúrate de que los contenedores se hayan iniciado correctamente con `docker-compose up` antes de ejecutar `exec`.

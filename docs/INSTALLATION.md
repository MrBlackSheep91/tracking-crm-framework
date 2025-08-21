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
git clone <URL_DEL_REPOSITORIO> innova-tracking-framework
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
docker-compose exec backend npm run prisma:migrate
```

### 5. Verificar la Instalación del Backend

Abre tu navegador o usa `curl` para comprobar que la API está funcionando correctamente.

```bash
curl http://localhost:3001/api/health
```

Deberías recibir una respuesta como esta:

```json
{
  "status": "ok",
  "timestamp": "2024-07-29T12:00:00.000Z"
}
```

¡Felicidades! El backend está instalado y funcionando.

## 📦 Paso 2: Integración del Cliente Frontend

Con el backend listo, el siguiente paso es integrar el cliente de tracking en tu aplicación frontend.

El cliente se distribuye como un paquete de `npm`, por lo que la instalación es muy sencilla.

```bash
npm install @innova-marketing/tracking-crm-framework
```

Para obtener instrucciones detalladas sobre cómo inicializar y usar el tracker en tu proyecto (React, Vue, JS Vanilla), consulta nuestra **[Guía de Integración](./INTEGRATION.md)**.

## 🆘 Troubleshooting

-   **Error de conexión a la base de datos**: Verifica que el contenedor de `db` esté corriendo (`docker ps`). Asegúrate de que las credenciales en `DATABASE_URL` coincidan con las de `docker-compose.yml`.
-   **Puerto `3001` o `5433` ocupado**: Detén cualquier otro servicio que esté usando esos puertos o cámbialos en `docker-compose.yml` y en tu archivo `.env`.
-   **Comando `docker-compose exec` falla**: Asegúrate de que los contenedores se hayan iniciado correctamente con `docker-compose up` antes de ejecutar `exec`.

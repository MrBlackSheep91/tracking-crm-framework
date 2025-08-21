# Use an official Node.js runtime as a parent image (Ubuntu-based for better Prisma compatibility)
FROM node:18-bullseye-slim

# Set the working directory in the container
WORKDIR /app

# SOLUCIÓN DEFINITIVA: UBUNTU + PRISMA ENGINES COMPATIBLES
# Instalar TODAS las dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    libssl1.1 \
    ca-certificates \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Variables de entorno para Prisma (Ubuntu binaries)
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-1.1.x"
ENV PRISMA_ENGINES_MIRROR="https://binaries.prisma.sh"
ENV OPENSSL_ROOT_DIR="/usr"
ENV OPENSSL_LIB_DIR="/usr/lib/x86_64-linux-gnu"
ENV OPENSSL_INCLUDE_DIR="/usr/include/openssl"

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY tsconfig.json ./

# Install any dependencies
RUN npm install

# Copy prisma schema ANTES de generar cliente
COPY prisma ./prisma

# Regenerar cliente Prisma DENTRO del contenedor para asegurar compatibilidad
RUN rm -rf node_modules/.prisma || true
RUN npm install @prisma/client
RUN npx prisma generate

# Verificar que el engine fue generado correctamente
RUN ls -la node_modules/.prisma/client/ && \
    ls -la node_modules/@prisma/engines/ || true

# Copy the rest of the application code
COPY src ./src

# Build the TypeScript code
# La compilación se mueve al CMD para asegurar que se ejecute en cada inicio

# Expose the port the app runs on
EXPOSE 3001

# Variables de runtime para debugging
ENV DEBUG="prisma:*"
ENV PRISMA_HIDE_UPDATE_MESSAGE="true"

# Copy and set the entrypoint
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

# Define the default command to run the app
CMD ["npm", "run", "dev"]

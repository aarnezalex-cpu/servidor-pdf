# Usar una imagen oficial de Node.js
FROM node:18-slim

# Instalar LibreOffice de forma nativa en el servidor Linux
RUN apt-get update && apt-get install -y libreoffice --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Configurar la carpeta de trabajo
WORKDIR /app

# Copiar las dependencias y el código
COPY package*.json ./
RUN npm install
COPY . .

# Exponer el puerto
EXPOSE 3000

# Arrancar el servidor
CMD ["node", "server.js"]
 
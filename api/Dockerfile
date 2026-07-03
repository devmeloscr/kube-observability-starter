FROM node:20-alpine
WORKDIR /app

# Instala dependencias primeiro (melhor cache de camadas)
COPY package.json ./
RUN npm install --omit=dev

# Codigo da aplicacao
COPY server.js ./

EXPOSE 3000
CMD ["npm", "start"]

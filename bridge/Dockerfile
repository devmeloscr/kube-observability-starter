FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY bridge.js ./
EXPOSE 8080
CMD ["npm", "start"]

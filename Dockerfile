# Estágio 1: Build da aplicação React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:stable-alpine
# Copia o arquivo de configuração que você já tem
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia os arquivos buildados do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

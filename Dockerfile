FROM node:22-alpine AS build
WORKDIR /app

COPY web/package.json /app/web/package.json
WORKDIR /app/web
RUN npm install

WORKDIR /app
COPY . .
WORKDIR /app/web
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

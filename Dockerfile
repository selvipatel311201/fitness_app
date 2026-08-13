# Build the static site, then serve it from nginx. The final image carries no
# node_modules and no toolchain — just the contents of dist/.

FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so the dependency layer is cached until they change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
# 127.0.0.1, not localhost: localhost resolves to ::1 first inside the container
# and nginx here listens on IPv4 only, which would fail an otherwise fine server.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

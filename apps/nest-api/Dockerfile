# ==========================================
# Stage 1: build (full dependencies, compiles TypeScript)
# Also used by docker-compose's "migrate" job, since it has the prisma CLI
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# Prisma's engines need OpenSSL on Alpine
RUN apk add --no-cache openssl

# Install dependencies first so Docker can cache this layer
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma Client for this (Linux) platform, then build
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ==========================================
# Stage 2: runtime (production dependencies only)
# ==========================================
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Reuse the Prisma Client generated in the build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

# Don't run the app as root
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]

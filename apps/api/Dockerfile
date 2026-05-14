FROM node:20-alpine

# sharp requires native build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/emails/package.json ./packages/emails/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/types/package.json ./packages/types/

RUN npm ci

# Copy application sources after install so symlinks resolve
COPY apps/api/src ./apps/api/src
COPY packages ./packages

ENV PATH="/app/node_modules/.bin:${PATH}"

EXPOSE 4000
CMD ["tsx", "apps/api/src/index.ts"]

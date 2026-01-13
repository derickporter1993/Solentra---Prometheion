# Salesforce DevOps Platform - Core Service Dockerfile

# =============================================================================
# Base stage
# =============================================================================
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS deps

# Copy package files
COPY package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/masking/package.json ./packages/masking/
COPY packages/sf-client/package.json ./packages/sf-client/
COPY packages/sdk/package.json ./packages/sdk/
COPY services/core/package.json ./services/core/

# Install dependencies
RUN npm install

# =============================================================================
# Builder stage
# =============================================================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd services/core && npx prisma generate

# Build all packages
RUN npm run build

# =============================================================================
# Development stage
# =============================================================================
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd services/core && npx prisma generate

# Install tsx for development
RUN npm install -g tsx

WORKDIR /app/services/core

EXPOSE 3001

# Default command (override in docker-compose)
CMD ["npm", "run", "dev:api"]

# =============================================================================
# Production stage
# =============================================================================
FROM base AS production

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 platform

# Copy built files
COPY --from=builder --chown=platform:nodejs /app/services/core/dist ./dist
COPY --from=builder --chown=platform:nodejs /app/services/core/node_modules ./node_modules
COPY --from=builder --chown=platform:nodejs /app/services/core/package.json ./
COPY --from=builder --chown=platform:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER platform

EXPOSE 3001

CMD ["node", "dist/main.js"]

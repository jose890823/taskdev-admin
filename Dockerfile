# ============================================
# DOCKERFILE - MiChambita Admin (Nuxt 3)
# Multi-stage build for production deployment
# ============================================

# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Copy package files (pnpm-workspace.yaml contiene los overrides referenciados en el lockfile)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies (--ignore-scripts evita que postinstall:nuxt prepare falle sin la app)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================
# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NUXT_PUBLIC_API_URL
ARG NUXT_PUBLIC_APP_NAME

ENV NUXT_PUBLIC_API_URL=${NUXT_PUBLIC_API_URL}
ENV NUXT_PUBLIC_APP_NAME=${NUXT_PUBLIC_APP_NAME}

# Build the application
RUN pnpm run build

# ============================================
# Stage 3: Production Runner
FROM node:24-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copy necessary files from builder
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]

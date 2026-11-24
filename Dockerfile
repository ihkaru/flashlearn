# Multi-stage production Dockerfile for FlashLearn (Bun Monorepo)
FROM oven/bun:1.4-alpine AS base
WORKDIR /app

# Stage 1: Dependencies and Frontend Build
FROM base AS builder

COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY apps/api ./apps/api
COPY start.sh ./start.sh

# Build Svelte 5 + Framework7 production assets
RUN cd apps/web && bun run build

# Stage 2: Production Runtime
FROM oven/bun:1.4-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PUBLIC_DIR=/app/apps/web/dist

COPY --chown=bun:bun --from=builder /app/package.json /app/bun.lock /app/start.sh ./
COPY --chown=bun:bun --from=builder /app/node_modules ./node_modules
COPY --chown=bun:bun --from=builder /app/packages ./packages
COPY --chown=bun:bun --from=builder /app/apps/api ./apps/api
COPY --chown=bun:bun --from=builder /app/apps/web/dist ./apps/web/dist

RUN chmod +x /app/start.sh

USER bun

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/app/start.sh"]

# =============================================================
# Build stage — compile TypeScript
# Build context: repo root  (docker build -f apps/api/Dockerfile .)
# =============================================================
FROM node:18-alpine AS builder

ENV NODE_ENV=development
WORKDIR /workspace

# Enable pnpm via corepack (bundled with Node 18+)
RUN corepack enable

# Copy workspace manifests — cached layer unless deps change
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies needed for the build
RUN pnpm install --frozen-lockfile

# TypeScript configs
COPY tsconfig.base.json ./
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/api/tsconfig.json ./apps/api/

# Source code
COPY packages/shared/src ./packages/shared/src
COPY apps/api/src ./apps/api/src

# Build shared first, then api
RUN pnpm --filter @autoops/shared build
RUN pnpm --filter @autoops/api build

# =============================================================
# Production stage — minimal runtime image
# =============================================================
FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN corepack enable

# Workspace manifests needed for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder --chown=1000:1000 /workspace/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=1000:1000 /workspace/packages/shared/dist ./packages/shared/dist

USER 1000:1000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]

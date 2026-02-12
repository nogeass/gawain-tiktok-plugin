FROM node:20-slim AS builder

WORKDIR /app

# Copy root SDK files (connector depends on it via file: reference)
COPY package.json package-lock.json ./
COPY src/ ./src/
COPY tsconfig.json ./

# Install root SDK dependencies
RUN npm ci --ignore-scripts

# Build root SDK
RUN npm run build

# Copy connector app
COPY apps/connector/package.json apps/connector/tsconfig.json ./apps/connector/
COPY apps/connector/src/ ./apps/connector/src/

# Install connector dependencies
WORKDIR /app/apps/connector
RUN npm ci --ignore-scripts

# Build connector
RUN npm run build

# --- Production stage ---
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built SDK (needed by connector at runtime)
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/package.json ./

# Copy built connector
COPY --from=builder /app/apps/connector/dist/ ./apps/connector/dist/
COPY --from=builder /app/apps/connector/package.json ./apps/connector/
COPY --from=builder /app/apps/connector/node_modules/ ./apps/connector/node_modules/

# Copy policy markdown files (read at runtime by pages router)
COPY docs/policies/ ./docs/policies/

# SQLite data directory (volume mount point)
RUN mkdir -p /data
ENV SQLITE_PATH=/data/connector.db
ENV NODE_ENV=production

EXPOSE 3456

ENTRYPOINT ["tini", "--"]
WORKDIR /app/apps/connector
CMD ["node", "dist/index.js"]

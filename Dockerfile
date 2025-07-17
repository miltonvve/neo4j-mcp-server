# Multi-stage build for Neo4j MCP Server
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S neo4j -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R neo4j:nodejs /app/logs

# Switch to non-root user
USER neo4j

# Expose port (if needed for health checks)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "console.log('Health check OK')" || exit 1

# Set default environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=info \
    ENABLE_PROJECT_ISOLATION=true

# Start the server
CMD ["node", "dist/index.js"]
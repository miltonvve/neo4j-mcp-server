#!/usr/bin/env node

import { EnhancedNeo4jMCPServer } from './mcp-server';
import { MCPServerConfig } from './types';

const config: MCPServerConfig = {
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://20.12.115.66:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'your-secure-password-123',
    database: process.env.NEO4J_DATABASE || 'neo4j',
    maxConnectionPoolSize: parseInt(process.env.NEO4J_MAX_POOL_SIZE || '100'),
    connectionTimeout: parseInt(process.env.NEO4J_CONNECTION_TIMEOUT || '30000'),
    maxTransactionRetryTime: parseInt(process.env.NEO4J_MAX_RETRY_TIME || '30000'),
  },
  logging: {
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
  },
  security: {
    enableProjectIsolation: process.env.ENABLE_PROJECT_ISOLATION !== 'false',
    maxQueryExecutionTime: parseInt(process.env.MAX_QUERY_EXECUTION_TIME || '30000'),
    allowedLabels: process.env.ALLOWED_LABELS?.split(','),
    forbiddenQueries: process.env.FORBIDDEN_QUERIES?.split(','),
  },
};

const server = new EnhancedNeo4jMCPServer(config);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// Start the server
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
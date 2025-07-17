import { z } from 'zod';

// Project namespace schema
export const ProjectNamespaceSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  settings: z.object({
    maxNodes: z.number().default(10000),
    maxRelationships: z.number().default(50000),
    enableAutoIndex: z.boolean().default(true),
    retentionDays: z.number().default(30),
  }).optional(),
});

export type ProjectNamespace = z.infer<typeof ProjectNamespaceSchema>;

// Query context schema
export const QueryContextSchema = z.object({
  projectId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  requestId: z.string(),
  timestamp: z.date(),
});

export type QueryContext = z.infer<typeof QueryContextSchema>;

// Audit log schema
export const AuditLogSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'QUERY']),
  resource: z.string(),
  query: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  timestamp: z.date(),
  success: z.boolean(),
  error: z.string().optional(),
  duration: z.number().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// MCP tool schemas
export const CreateNodeSchema = z.object({
  projectId: z.string(),
  label: z.string(),
  properties: z.record(z.any()),
});

export const CreateRelationshipSchema = z.object({
  projectId: z.string(),
  fromNode: z.object({
    label: z.string(),
    properties: z.record(z.any()),
  }),
  toNode: z.object({
    label: z.string(),
    properties: z.record(z.any()),
  }),
  relationship: z.object({
    type: z.string(),
    properties: z.record(z.any()).optional(),
  }),
});

export const ExecuteQuerySchema = z.object({
  projectId: z.string(),
  query: z.string(),
  parameters: z.record(z.any()).optional(),
});

export const GetSchemaSchema = z.object({
  projectId: z.string(),
});

export const BackupProjectSchema = z.object({
  projectId: z.string(),
  includeData: z.boolean().default(true),
  includeSchema: z.boolean().default(true),
});

// Connection configuration
export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionTimeout?: number;
  maxTransactionRetryTime?: number;
}

// MCP server configuration
export interface MCPServerConfig {
  neo4j: Neo4jConfig;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableAuditLog: boolean;
  };
  security: {
    enableProjectIsolation: boolean;
    maxQueryExecutionTime: number;
    allowedLabels?: string[];
    forbiddenQueries?: string[];
  };
}
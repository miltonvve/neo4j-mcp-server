import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { Neo4jClient } from './neo4j-client';
import { Logger } from './logger';
import { MCPServerConfig, QueryContext } from './types';
import {
  CreateNodeSchema,
  CreateRelationshipSchema,
  ExecuteQuerySchema,
  GetSchemaSchema,
  BackupProjectSchema,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class EnhancedNeo4jMCPServer {
  private server: Server;
  private neo4jClient: Neo4jClient;
  private logger: Logger;
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.logger = new Logger(config.logging.level);
    this.neo4jClient = new Neo4jClient(config.neo4j, this.logger);
    this.server = new Server(
      {
        name: 'enhanced-neo4j-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_project_namespace',
            description: 'Create a new project namespace for data isolation',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Unique identifier for the project',
                },
                name: {
                  type: 'string',
                  description: 'Human-readable name for the project',
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the project',
                },
              },
              required: ['projectId', 'name'],
            },
          },
          {
            name: 'create_node',
            description: 'Create a new node in the specified project namespace',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project namespace identifier',
                },
                label: {
                  type: 'string',
                  description: 'Node label/type',
                },
                properties: {
                  type: 'object',
                  description: 'Node properties as key-value pairs',
                },
              },
              required: ['projectId', 'label', 'properties'],
            },
          },
          {
            name: 'create_relationship',
            description: 'Create a relationship between two nodes',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project namespace identifier',
                },
                fromNode: {
                  type: 'object',
                  description: 'Source node specification',
                  properties: {
                    label: { type: 'string' },
                    properties: { type: 'object' },
                  },
                  required: ['label', 'properties'],
                },
                toNode: {
                  type: 'object',
                  description: 'Target node specification',
                  properties: {
                    label: { type: 'string' },
                    properties: { type: 'object' },
                  },
                  required: ['label', 'properties'],
                },
                relationship: {
                  type: 'object',
                  description: 'Relationship specification',
                  properties: {
                    type: { type: 'string' },
                    properties: { type: 'object' },
                  },
                  required: ['type'],
                },
              },
              required: ['projectId', 'fromNode', 'toNode', 'relationship'],
            },
          },
          {
            name: 'execute_cypher_query',
            description: 'Execute a Cypher query within a project namespace',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project namespace identifier',
                },
                query: {
                  type: 'string',
                  description: 'Cypher query to execute',
                },
                parameters: {
                  type: 'object',
                  description: 'Query parameters',
                },
              },
              required: ['projectId', 'query'],
            },
          },
          {
            name: 'get_project_schema',
            description: 'Get the schema information for a project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project namespace identifier',
                },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'backup_project',
            description: 'Create a backup of project data',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project namespace identifier',
                },
                includeData: {
                  type: 'boolean',
                  description: 'Include node and relationship data',
                  default: true,
                },
                includeSchema: {
                  type: 'boolean',
                  description: 'Include schema information',
                  default: true,
                },
              },
              required: ['projectId'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_project_namespace':
            return await this.handleCreateProjectNamespace(args);

          case 'create_node':
            return await this.handleCreateNode(args);

          case 'create_relationship':
            return await this.handleCreateRelationship(args);

          case 'execute_cypher_query':
            return await this.handleExecuteCypherQuery(args);

          case 'get_project_schema':
            return await this.handleGetProjectSchema(args);

          case 'backup_project':
            return await this.handleBackupProject(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleCreateProjectNamespace(args: any) {
    const { projectId, name, description } = args;
    
    await this.neo4jClient.createProjectNamespace(projectId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Project namespace created successfully: ${projectId} (${name})`,
        },
      ],
    };
  }

  private async handleCreateNode(args: any) {
    const { projectId, label, properties } = CreateNodeSchema.parse(args);
    
    const context: QueryContext = {
      projectId,
      requestId: uuidv4(),
      timestamp: new Date(),
    };

    const query = `
      CREATE (n:${label} {projectId: $projectId})
      SET n += $properties
      RETURN n
    `;

    const result = await this.neo4jClient.executeQuery(
      query,
      { projectId, properties },
      context
    );

    return {
      content: [
        {
          type: 'text',
          text: `Node created successfully. Created ${result.records.length} node(s).`,
        },
      ],
    };
  }

  private async handleCreateRelationship(args: any) {
    const { projectId, fromNode, toNode, relationship } = CreateRelationshipSchema.parse(args);
    
    const context: QueryContext = {
      projectId,
      requestId: uuidv4(),
      timestamp: new Date(),
    };

    const query = `
      MERGE (a:${fromNode.label} {projectId: $projectId})
      SET a += $fromProperties
      MERGE (b:${toNode.label} {projectId: $projectId})
      SET b += $toProperties
      MERGE (a)-[r:${relationship.type}]->(b)
      SET r += $relationshipProperties
      RETURN a, r, b
    `;

    const result = await this.neo4jClient.executeQuery(
      query,
      {
        projectId,
        fromProperties: fromNode.properties,
        toProperties: toNode.properties,
        relationshipProperties: relationship.properties || {},
      },
      context
    );

    return {
      content: [
        {
          type: 'text',
          text: `Relationship created successfully. Created ${result.records.length} relationship(s).`,
        },
      ],
    };
  }

  private async handleExecuteCypherQuery(args: any) {
    const { projectId, query, parameters } = ExecuteQuerySchema.parse(args);
    
    const context: QueryContext = {
      projectId,
      requestId: uuidv4(),
      timestamp: new Date(),
    };

    const result = await this.neo4jClient.executeQuery(query, parameters || {}, context);

    const records = result.records.map(record => {
      const obj: any = {};
      record.keys.forEach((key, index) => {
        obj[key] = record.get(index);
      });
      return obj;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Query executed successfully. Returned ${records.length} record(s).`,
        },
        {
          type: 'text',
          text: `Results: ${JSON.stringify(records, null, 2)}`,
        },
      ],
    };
  }

  private async handleGetProjectSchema(args: any) {
    const { projectId } = GetSchemaSchema.parse(args);
    
    const schema = await this.neo4jClient.getProjectSchema(projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Schema for project ${projectId}:`,
        },
        {
          type: 'text',
          text: JSON.stringify(schema, null, 2),
        },
      ],
    };
  }

  private async handleBackupProject(args: any) {
    const { projectId, includeData, includeSchema } = BackupProjectSchema.parse(args);
    
    const backupData = await this.neo4jClient.backupProject(projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Backup created for project ${projectId}`,
        },
        {
          type: 'text',
          text: `Backup data: ${backupData.length} characters`,
        },
      ],
    };
  }

  async start(): Promise<void> {
    try {
      await this.neo4jClient.testConnection();
      this.logger.info('Neo4j connection established');

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.logger.info('Enhanced Neo4j MCP server started');
    } catch (error) {
      this.logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.neo4jClient.close();
    this.logger.info('Enhanced Neo4j MCP server stopped');
  }
}
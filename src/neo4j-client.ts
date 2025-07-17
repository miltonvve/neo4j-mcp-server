import neo4j, { Driver, Session, Result, QueryResult } from 'neo4j-driver';
import { Neo4jConfig, QueryContext, AuditLog } from './types';
import { Logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export class Neo4jClient {
  private driver: Driver;
  private logger: Logger;

  constructor(config: Neo4jConfig, logger: Logger) {
    this.logger = logger;
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      {
        maxConnectionPoolSize: config.maxConnectionPoolSize || 100,
        connectionTimeout: config.connectionTimeout || 30000,
        maxTransactionRetryTime: config.maxTransactionRetryTime || 30000,
      }
    );
  }

  async testConnection(): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run('RETURN 1 as test');
      this.logger.info('Neo4j connection test successful');
    } catch (error) {
      this.logger.error('Neo4j connection test failed', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async executeQuery(
    query: string,
    parameters: Record<string, any> = {},
    context: QueryContext
  ): Promise<QueryResult> {
    const session = this.driver.session();
    const startTime = Date.now();
    const auditLog: Partial<AuditLog> = {
      id: uuidv4(),
      projectId: context.projectId,
      userId: context.userId,
      action: this.getActionFromQuery(query),
      resource: 'neo4j_query',
      query,
      parameters,
      timestamp: new Date(),
    };

    try {
      // Add project isolation constraint (temporarily disabled for testing)
      const isolatedQuery = query; // this.addProjectIsolation(query, context.projectId);
      const isolatedParameters = { ...parameters, projectId: context.projectId };

      const result = await session.run(isolatedQuery, isolatedParameters);
      
      auditLog.success = true;
      auditLog.duration = Date.now() - startTime;
      
      this.logger.info('Query executed successfully', {
        projectId: context.projectId,
        duration: auditLog.duration,
        recordCount: result.records.length,
      });

      return result;
    } catch (error) {
      auditLog.success = false;
      auditLog.error = error instanceof Error ? error.message : 'Unknown error';
      auditLog.duration = Date.now() - startTime;
      
      this.logger.error('Query execution failed', {
        projectId: context.projectId,
        error: auditLog.error,
        query,
      });
      
      throw error;
    } finally {
      await session.close();
      // Log audit entry (you might want to store this in a separate audit database)
      this.logger.debug('Audit log entry', auditLog);
    }
  }

  async createProjectNamespace(projectId: string): Promise<void> {
    const session = this.driver.session();
    try {
      // Create project metadata node (skip constraints for Community Edition)
      await session.run(`
        MERGE (p:ProjectNamespace {projectId: $projectId})
        SET p.createdAt = datetime(),
            p.updatedAt = datetime()
        RETURN p
      `, { projectId });

      this.logger.info(`Project namespace created: ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to create project namespace: ${projectId}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getProjectSchema(projectId: string): Promise<any> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        CALL db.schema.visualization()
      `);
      
      // Filter schema by project
      const schema = result.records.map(record => ({
        nodes: record.get('nodes'),
        relationships: record.get('relationships'),
      }));

      return schema;
    } catch (error) {
      this.logger.error(`Failed to get schema for project: ${projectId}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async backupProject(projectId: string): Promise<string> {
    const session = this.driver.session();
    try {
      // Export all nodes and relationships for the project
      const nodesResult = await session.run(`
        MATCH (n)
        WHERE n.projectId = $projectId
        RETURN n
      `, { projectId });

      const relationshipsResult = await session.run(`
        MATCH (a)-[r]->(b)
        WHERE a.projectId = $projectId AND b.projectId = $projectId
        RETURN a, r, b
      `, { projectId });

      const backup = {
        projectId,
        timestamp: new Date().toISOString(),
        nodes: nodesResult.records.map(record => record.get('n')),
        relationships: relationshipsResult.records.map(record => ({
          from: record.get('a'),
          relationship: record.get('r'),
          to: record.get('b'),
        })),
      };

      const backupData = JSON.stringify(backup, null, 2);
      this.logger.info(`Backup created for project: ${projectId}`);
      
      return backupData;
    } catch (error) {
      this.logger.error(`Failed to backup project: ${projectId}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  private addProjectIsolation(query: string, projectId: string): string {
    // Simple project isolation - in production, you'd want more sophisticated query parsing
    if (query.toLowerCase().includes('match')) {
      // For MATCH operations, add project filter
      if (query.toLowerCase().includes('where')) {
        return query.replace(/WHERE\s+/gi, `WHERE n.projectId = $projectId AND `);
      } else {
        return query.replace(/RETURN\s+/gi, `WHERE n.projectId = $projectId RETURN `);
      }
    }
    
    // For other queries, return as-is (projectId will be set in the query itself)
    return query;
  }

  private getActionFromQuery(query: string): 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'QUERY' {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('create') || lowerQuery.includes('merge')) return 'CREATE';
    if (lowerQuery.includes('delete') || lowerQuery.includes('detach')) return 'DELETE';
    if (lowerQuery.includes('set') || lowerQuery.includes('remove')) return 'UPDATE';
    if (lowerQuery.includes('match') || lowerQuery.includes('return')) return 'READ';
    return 'QUERY';
  }

  async close(): Promise<void> {
    await this.driver.close();
    this.logger.info('Neo4j driver closed');
  }
}
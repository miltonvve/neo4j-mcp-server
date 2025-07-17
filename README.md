# Neo4j MCP Server

🚀 **Production-ready Neo4j MCP server with multi-tenancy and Azure AKS deployment**

[![CI/CD](https://github.com/miltonvve/neo4j-mcp-server/workflows/CI/badge.svg)](https://github.com/miltonvve/neo4j-mcp-server/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?logo=neo4j&logoColor=white)](https://neo4j.com/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)

A comprehensive Model Context Protocol (MCP) server for Neo4j that enables seamless integration between Claude Code and Neo4j graph databases. Built with enterprise-grade features including multi-tenancy, project isolation, and production-ready Azure AKS deployment.

## ✨ Features

### 🔧 **Core Capabilities**
- **Multi-tenant Architecture** - Project isolation with namespace management
- **MCP Protocol Support** - Full integration with Claude Code and other MCP clients
- **Production Ready** - Enterprise-grade deployment on Azure AKS
- **Type Safety** - Built with TypeScript and Zod validation
- **Comprehensive Logging** - Winston-based logging with audit trails

### 🛠 **Neo4j Integration**
- **Query Execution** - Execute Cypher queries with project isolation
- **Node Management** - Create, update, and query nodes with labels
- **Relationship Management** - Build complex graph relationships
- **Schema Management** - Dynamic schema discovery and validation
- **Backup & Restore** - Project-specific data export/import

### 🏗 **Infrastructure**
- **Kubernetes Deployment** - Complete AKS manifest files
- **SSL/TLS Security** - Azure Application Gateway integration
- **Monitoring** - Prometheus metrics and Grafana dashboards
- **Auto-scaling** - Horizontal pod autoscaling support
- **Health Checks** - Comprehensive health monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Neo4j 5.15+ (Community or Enterprise)
- Claude Code or other MCP client

### Installation

```bash
# Install via npm
npm install -g neo4j-mcp-server

# Or clone and build
git clone https://github.com/miltonvve/neo4j-mcp-server.git
cd neo4j-mcp-server
npm install
npm run build
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
vim .env
```

### Basic Usage

```bash
# Start the MCP server
neo4j-mcp-server

# Or run in development mode
npm run dev
```

### Claude Integration

Add to your Claude configuration:

```json
{
  "mcpServers": {
    "neo4j": {
      "command": "neo4j-mcp-server",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "password"
      }
    }
  }
}
```

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Neo4j MCP Server                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    MCP Protocol    ┌────────────────┐     │
│  │   Claude    │◄─────────────────►│  MCP Server    │     │
│  │    Code     │                    │  (TypeScript)  │     │
│  └─────────────┘                    └────────────────┘     │
│                                              │               │
│                                              │               │
│  ┌─────────────────────────────────────────▼─────────────┐ │
│  │            Project Isolation Layer                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ Project A   │  │ Project B   │  │ Project C   │  │ │
│  │  │ Namespace   │  │ Namespace   │  │ Namespace   │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  └─────────────────────────────────────────┬─────────────┘ │
│                                              │               │
│  ┌─────────────────────────────────────────▼─────────────┐ │
│  │                Neo4j Database                        │ │
│  │              (Community/Enterprise)                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Design

- **Project Isolation**: Each project gets its own namespace
- **Resource Limits**: Configurable limits per project
- **Audit Logging**: All operations tracked per project
- **Security**: Role-based access control

## 📋 MCP Tools Reference

### Project Management

#### `create_project_namespace`
Creates a new project namespace for data isolation.

```typescript
{
  projectId: string;
  name: string;
  description?: string;
}
```

### Node Operations

#### `create_node`
Creates a new node in the specified project namespace.

```typescript
{
  projectId: string;
  label: string;
  properties: Record<string, any>;
}
```

### Relationship Operations

#### `create_relationship`
Creates a relationship between two nodes.

```typescript
{
  projectId: string;
  fromNode: { label: string; properties: Record<string, any> };
  toNode: { label: string; properties: Record<string, any> };
  relationship: { type: string; properties?: Record<string, any> };
}
```

### Query Operations

#### `execute_cypher_query`
Executes a Cypher query within a project namespace.

```typescript
{
  projectId: string;
  query: string;
  parameters?: Record<string, any>;
}
```

### Utility Operations

#### `get_project_schema`
Retrieves schema information for a project.

#### `backup_project`
Creates a backup of project data.

## 🏗 Deployment

### Docker Compose (Development)

```bash
cd examples/docker-compose
docker-compose up -d
```

### Azure AKS (Production)

```bash
# Deploy to Azure
./scripts/deploy-azure.sh

# Setup SSL/TLS
./scripts/setup-ssl.sh

# Health check
./scripts/health-check.sh
```

For detailed deployment instructions, see:
- [Azure AKS Deployment Guide](docs/deployment/azure-aks.md)
- [Docker Compose Setup](docs/deployment/docker-compose.md)
- [Security Configuration](docs/deployment/security.md)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEO4J_URI` | Neo4j connection URI | `bolt://localhost:7687` |
| `NEO4J_USERNAME` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `password` |
| `LOG_LEVEL` | Logging level | `info` |
| `ENABLE_PROJECT_ISOLATION` | Enable project isolation | `true` |
| `MAX_QUERY_EXECUTION_TIME` | Query timeout (ms) | `30000` |

### Security Configuration

```typescript
{
  enableProjectIsolation: boolean;
  maxQueryExecutionTime: number;
  allowedLabels?: string[];
  forbiddenQueries?: string[];
}
```

## 📊 Monitoring

### Metrics

- Query execution times
- Error rates by project
- Connection pool status
- Memory usage
- Request throughput

### Logging

- Structured JSON logging
- Audit trail for all operations
- Error tracking and alerting
- Performance monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/miltonvve/neo4j-mcp-server.git
cd neo4j-mcp-server
npm install
npm run dev
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [API Reference](docs/api/mcp-tools.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Deployment Guides](docs/deployment/)
- [Examples](examples/)

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
- Check Neo4j service status
- Verify connection credentials
- Ensure network connectivity

**Project Isolation Issues**
- Verify project namespace exists
- Check project permissions
- Review audit logs

**Performance Issues**
- Monitor query execution times
- Check connection pool settings
- Review resource limits

For more help, see [Troubleshooting Guide](docs/troubleshooting.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Neo4j](https://neo4j.com/) for the amazing graph database
- [Anthropic](https://www.anthropic.com/) for Claude and MCP protocol
- [Microsoft Azure](https://azure.microsoft.com/) for cloud infrastructure
- The open-source community for inspiration and contributions

## 🔗 Links

- [Neo4j Documentation](https://neo4j.com/docs/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Claude Code Documentation](https://claude.ai/code)

---

**Built with ❤️ by GenAI Guru**

For questions or support, please [open an issue](https://github.com/miltonvve/neo4j-mcp-server/issues) or contact [miltonvve@gmail.com](mailto:miltonvve@gmail.com).
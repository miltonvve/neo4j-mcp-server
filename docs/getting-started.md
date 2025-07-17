# Getting Started with Neo4j MCP Server

This guide will help you quickly get up and running with the Neo4j MCP Server.

## Prerequisites

- Node.js 18+ and npm 8+
- Neo4j 5.15+ (Community or Enterprise Edition)
- Claude Code or another MCP-compatible client

## Installation Methods

### Method 1: NPM Install (Recommended)

```bash
# Install globally
npm install -g neo4j-mcp-server

# Verify installation
neo4j-mcp-server --version
```

### Method 2: Docker Compose (Quickest)

```bash
# Clone the repository
git clone https://github.com/miltonvve/neo4j-mcp-server.git
cd neo4j-mcp-server

# Start with Docker Compose
cd examples/docker-compose
docker-compose up -d

# Check status
docker-compose ps
```

### Method 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/miltonvve/neo4j-mcp-server.git
cd neo4j-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Neo4j Connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# Server Configuration
LOG_LEVEL=info
ENABLE_PROJECT_ISOLATION=true
MAX_QUERY_EXECUTION_TIME=30000

# Security (Optional)
ALLOWED_LABELS=User,Content,Project
FORBIDDEN_QUERIES=DROP,DELETE ALL
```

### Claude Configuration

Add to your Claude configuration file:

```json
{
  "mcpServers": {
    "neo4j": {
      "command": "neo4j-mcp-server",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your-password"
      }
    }
  }
}
```

## First Steps

### 1. Test the Connection

```bash
# Test Neo4j connection
curl -u neo4j:password http://localhost:7474/db/data/

# Test MCP server
neo4j-mcp-server --test
```

### 2. Create Your First Project

Using Claude Code:

```
Create a new project namespace called "my-first-project" with name "My First Project"
```

Or using the API directly:

```bash
# Test with the example script
node examples/alpha-ai-integration/setup-project.js setup
```

### 3. Add Some Data

```
Create a user node in project "my-first-project" with label "User" and properties:
- name: "John Doe"
- email: "john@example.com"
- role: "developer"
```

### 4. Query the Data

```
Execute a Cypher query in project "my-first-project": 
MATCH (u:User) RETURN u.name, u.email
```

## Common Use Cases

### Content Recommendation System

```cypher
-- Create users
CREATE (u:User {name: "Alice", interests: ["AI", "ML"]})

-- Create content
CREATE (c:Content {title: "Intro to AI", topics: ["AI", "basics"]})

-- Create relationships
MATCH (u:User {name: "Alice"})
MATCH (c:Content {title: "Intro to AI"})
CREATE (u)-[:INTERESTED_IN {strength: 0.8}]->(c)

-- Get recommendations
MATCH (u:User {name: "Alice"})-[r:INTERESTED_IN]->(c:Content)
RETURN c.title, r.strength
ORDER BY r.strength DESC
```

### Knowledge Graph

```cypher
-- Create entities
CREATE (p:Person {name: "John"})
CREATE (c:Company {name: "TechCorp"})
CREATE (s:Skill {name: "Python"})

-- Create relationships
MATCH (p:Person {name: "John"})
MATCH (c:Company {name: "TechCorp"})
MATCH (s:Skill {name: "Python"})
CREATE (p)-[:WORKS_FOR]->(c)
CREATE (p)-[:HAS_SKILL]->(s)

-- Query connections
MATCH (p:Person)-[r]->(n)
RETURN p.name, type(r), n.name
```

## Next Steps

1. **Read the API Documentation**: [MCP Tools Reference](api/mcp-tools.md)
2. **Deploy to Production**: [Azure AKS Deployment](deployment/azure-aks.md)
3. **Secure Your Setup**: [Security Configuration](deployment/security.md)
4. **Monitor Performance**: [Monitoring Guide](../kubernetes/monitoring/)
5. **Explore Examples**: [Example Projects](../examples/)

## Troubleshooting

### Common Issues

**Connection Refused**
```bash
# Check if Neo4j is running
docker ps | grep neo4j

# Check logs
docker logs neo4j-container
```

**Permission Denied**
```bash
# Check user permissions
ls -la ~/.neo4j/

# Fix permissions
chown -R $(whoami) ~/.neo4j/
```

**Memory Issues**
```bash
# Increase heap size
export NEO4J_dbms_memory_heap_max__size=2G
```

### Getting Help

- **Documentation**: Check the [docs/](../) directory
- **Issues**: Open an issue on [GitHub](https://github.com/miltonvve/neo4j-mcp-server/issues)
- **Examples**: Look at [examples/](../examples/) for sample code
- **Community**: Join the discussions in GitHub Discussions

## What's Next?

Now that you have the basics working, you can:

1. **Integrate with your application** - Use the MCP tools in your AI workflows
2. **Scale up** - Deploy to Azure AKS for production use
3. **Customize** - Extend the server with your own tools and features
4. **Contribute** - Help improve the project by contributing code or documentation

Happy graphing! 🚀
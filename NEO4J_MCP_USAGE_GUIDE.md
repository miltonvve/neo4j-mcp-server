# Neo4j MCP Server Usage Guide

**🚀 Quick Reference for Using the Neo4j MCP Server with Claude**

---

## 📋 **Essential Information**

### **🔗 Connection Details**
- **Neo4j HTTP**: http://20.12.115.66:7474
- **Neo4j Bolt**: bolt://20.12.115.66:7687
- **Neo4j Browser**: http://20.12.115.66:7474/browser/
- **Username**: neo4j
- **Password**: your-secure-password-123
- **GitHub Repository**: https://github.com/miltonvve/neo4j-mcp-server

### **🏗 Infrastructure Status**
- **Azure Resource Group**: neo4j-production
- **AKS Cluster**: neo4j-aks (eastus2)
- **Kubernetes Namespace**: neo4j
- **Current Status**: ✅ RUNNING AND OPERATIONAL

---

## 🛠 **MCP Server Configuration**

### **Claude Configuration**
Add this to your Claude MCP configuration:

```json
{
  "mcpServers": {
    "neo4j": {
      "command": "neo4j-mcp-server",
      "env": {
        "NEO4J_URI": "bolt://20.12.115.66:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your-secure-password-123",
        "LOG_LEVEL": "info",
        "ENABLE_PROJECT_ISOLATION": "true"
      }
    }
  }
}
```

### **Local Development Setup**
```bash
# If running locally
cd /home/miltonvve/neo4j-mcp-server-repo
npm install
npm run build
npm start
```

---

## 🧰 **Available MCP Tools**

### **1. Project Management**

#### `create_project_namespace`
Creates a new isolated project namespace.

```json
{
  "projectId": "my-project",
  "name": "My Project Name",
  "description": "Optional description"
}
```

**Example Usage:**
```
Create a new project namespace with:
- projectId: "alpha-ai-v1"
- name: "Alpha AI Content System"
- description: "AI-powered content recommendation system"
```

### **2. Node Operations**

#### `create_node`
Creates a new node in a project namespace.

```json
{
  "projectId": "alpha-ai-v1",
  "label": "User",
  "properties": {
    "name": "John Doe",
    "email": "john@example.com",
    "path": "digital-yard",
    "skillLevel": "beginner"
  }
}
```

**Example Usage:**
```
Create a User node in project "alpha-ai-v1" with:
- name: "Jane Smith"
- email: "jane@example.com"
- path: "executive"
- interests: ["AI Strategy", "Leadership"]
```

### **3. Relationship Operations**

#### `create_relationship`
Creates relationships between nodes.

```json
{
  "projectId": "alpha-ai-v1",
  "fromNode": {
    "label": "User",
    "properties": {"name": "John Doe"}
  },
  "toNode": {
    "label": "Content",
    "properties": {"title": "AI Fundamentals"}
  },
  "relationship": {
    "type": "INTERESTED_IN",
    "properties": {"strength": 0.8, "timestamp": "2025-01-01T00:00:00Z"}
  }
}
```

**Example Usage:**
```
Create a relationship in project "alpha-ai-v1":
- From: User with name "John Doe"
- To: Content with title "AI Fundamentals"
- Relationship: INTERESTED_IN with strength 0.8
```

### **4. Query Operations**

#### `execute_cypher_query`
Executes Cypher queries within a project namespace.

```json
{
  "projectId": "alpha-ai-v1",
  "query": "MATCH (u:User)-[r:INTERESTED_IN]->(c:Content) RETURN u.name, c.title, r.strength ORDER BY r.strength DESC",
  "parameters": {}
}
```

**Example Usage:**
```
Execute this query in project "alpha-ai-v1":
MATCH (u:User {path: "digital-yard"})
RETURN u.name, u.skillLevel, u.interests
```

### **5. Utility Operations**

#### `get_project_schema`
Gets schema information for a project.

```json
{
  "projectId": "alpha-ai-v1"
}
```

#### `backup_project`
Creates a backup of project data.

```json
{
  "projectId": "alpha-ai-v1",
  "includeData": true,
  "includeSchema": true
}
```

---

## 🎯 **Common Usage Patterns**

### **Content Recommendation System**
```cypher
-- Create users with preferences
CREATE (u:User {name: "Alice", interests: ["AI", "Machine Learning"], skillLevel: "beginner"})

-- Create content items
CREATE (c:Content {title: "Introduction to AI", difficulty: "beginner", topics: ["AI", "basics"]})

-- Create interest relationships
MATCH (u:User {name: "Alice"})
MATCH (c:Content {title: "Introduction to AI"})
CREATE (u)-[:INTERESTED_IN {strength: 0.9, timestamp: datetime()}]->(c)

-- Get personalized recommendations
MATCH (u:User {name: "Alice"})-[:INTERESTED_IN]->(c:Content)
WHERE c.difficulty = u.skillLevel
RETURN c.title, c.topics
ORDER BY c.title
```

### **Knowledge Graph**
```cypher
-- Create knowledge entities
CREATE (p:Person {name: "John Smith", role: "developer"})
CREATE (s:Skill {name: "Python", category: "programming"})
CREATE (proj:Project {name: "AI Platform", status: "active"})

-- Create relationships
MATCH (p:Person {name: "John Smith"})
MATCH (s:Skill {name: "Python"})
MATCH (proj:Project {name: "AI Platform"})
CREATE (p)-[:HAS_SKILL {proficiency: "expert"}]->(s)
CREATE (p)-[:WORKS_ON {role: "lead"}]->(proj)
CREATE (proj)-[:REQUIRES_SKILL]->(s)

-- Find connections
MATCH (p:Person)-[r1:HAS_SKILL]->(s:Skill)<-[r2:REQUIRES_SKILL]-(proj:Project)
RETURN p.name, s.name, proj.name, r1.proficiency
```

### **User Journey Tracking**
```cypher
-- Create user journey
CREATE (u:User {name: "Student A", enrollmentDate: date()})
CREATE (c1:Content {title: "Lesson 1", order: 1})
CREATE (c2:Content {title: "Lesson 2", order: 2})
CREATE (c3:Content {title: "Final Project", order: 3})

-- Track progress
MATCH (u:User {name: "Student A"})
MATCH (c:Content {title: "Lesson 1"})
CREATE (u)-[:COMPLETED {completedAt: datetime(), score: 85}]->(c)

-- Get learning path
MATCH (u:User {name: "Student A"})-[:COMPLETED]->(completed:Content)
MATCH (next:Content)
WHERE next.order > completed.order
RETURN next.title, next.order
ORDER BY next.order
LIMIT 1
```

---

## 🔧 **Project Setup Examples**

### **Alpha AI Integration**
```bash
# Run the setup script
cd /home/miltonvve/neo4j-mcp-server-repo/examples/alpha-ai-integration
node setup-project.js setup

# Test the setup
node setup-project.js test
```

### **Custom Project Setup**
```
1. Create project namespace: "my-custom-project"
2. Create User nodes with relevant properties
3. Create Content/Resource nodes
4. Establish relationships (INTERESTED_IN, COMPLETED, RECOMMENDED)
5. Query for insights and recommendations
```

---

## 🚨 **Important Notes**

### **Security Considerations**
- **Password**: Currently using plain text (your-secure-password-123) - should be updated for production
- **Network**: Neo4j is exposed on public IP - consider VPN/firewall for production
- **Project Isolation**: Always specify projectId to maintain data separation

### **Performance Tips**
- **Batch Operations**: Group multiple node/relationship creations
- **Indexing**: Create indexes on frequently queried properties
- **Query Optimization**: Use EXPLAIN/PROFILE for complex queries

### **Troubleshooting**
- **Connection Issues**: Check if Neo4j service is running: `kubectl get pods -n neo4j`
- **MCP Server Issues**: Check logs: `tail -f /path/to/mcp-server.log`
- **Query Errors**: Verify Cypher syntax and node/relationship existence

---

## 📚 **Quick Commands Reference**

### **Health Checks**
```bash
# Check Neo4j status
curl http://20.12.115.66:7474/

# Check Kubernetes pods
kubectl get pods -n neo4j

# Test MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | neo4j-mcp-server
```

### **Backup & Recovery**
```bash
# Backup project data
Use the backup_project MCP tool

# Access Neo4j browser
Open: http://20.12.115.66:7474/browser/
Login: neo4j / your-secure-password-123
```

---

## 🎯 **Best Practices**

1. **Always specify projectId** for data isolation
2. **Use meaningful node labels** and relationship types
3. **Include timestamps** in relationships for temporal queries
4. **Create indexes** on frequently queried properties
5. **Test queries** in Neo4j Browser before using in MCP
6. **Monitor performance** with query profiling

---

## 🆘 **Need Help?**

- **Documentation**: https://github.com/miltonvve/neo4j-mcp-server/docs
- **Examples**: https://github.com/miltonvve/neo4j-mcp-server/examples
- **Neo4j Docs**: https://neo4j.com/docs/
- **MCP Protocol**: https://modelcontextprotocol.io/

**🚀 Ready to use! The Neo4j MCP Server is operational and waiting for your graph queries!**
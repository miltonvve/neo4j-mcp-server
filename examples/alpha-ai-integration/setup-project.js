#!/usr/bin/env node

/**
 * Alpha AI Integration Setup Script
 * 
 * This script sets up the Neo4j database with the Alpha AI project structure
 * including user profiles, content items, and recommendation relationships.
 */

const neo4j = require('neo4j-driver');

// Configuration
const config = {
  uri: process.env.NEO4J_URI || 'bolt://20.12.115.66:7687',
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'your-secure-password-123',
  projectId: 'alpha-ai-v1'
};

// Sample data for Alpha AI
const sampleData = {
  users: [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      path: 'digital-yard',
      skillLevel: 'beginner',
      interests: ['AI', 'Machine Learning', 'Python'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      path: 'executive',
      skillLevel: 'advanced',
      interests: ['AI Strategy', 'Leadership', 'Business Innovation'],
      createdAt: new Date().toISOString()
    }
  ],
  content: [
    {
      id: 'content-1',
      title: 'Introduction to AI',
      description: 'Learn the basics of artificial intelligence',
      type: 'article',
      difficulty: 'beginner',
      topics: ['AI', 'Machine Learning'],
      duration: '10 min read',
      author: 'Dr. Sarah Johnson',
      createdAt: new Date().toISOString()
    },
    {
      id: 'content-2',
      title: 'AI for Business Leaders',
      description: 'Strategic insights on implementing AI in organizations',
      type: 'course',
      difficulty: 'intermediate',
      topics: ['AI Strategy', 'Leadership', 'Business'],
      duration: '2 hours',
      author: 'Prof. Michael Chen',
      createdAt: new Date().toISOString()
    },
    {
      id: 'content-3',
      title: 'Python for AI Development',
      description: 'Master Python programming for AI projects',
      type: 'tutorial',
      difficulty: 'intermediate',
      topics: ['Python', 'AI', 'Programming'],
      duration: '45 min',
      author: 'Alex Rodriguez',
      createdAt: new Date().toISOString()
    }
  ],
  relationships: [
    {
      fromUser: 'user-1',
      toContent: 'content-1',
      type: 'INTERESTED_IN',
      strength: 0.9,
      timestamp: new Date().toISOString()
    },
    {
      fromUser: 'user-1',
      toContent: 'content-3',
      type: 'COMPLETED',
      completionRate: 1.0,
      timestamp: new Date().toISOString()
    },
    {
      fromUser: 'user-2',
      toContent: 'content-2',
      type: 'INTERESTED_IN',
      strength: 0.8,
      timestamp: new Date().toISOString()
    }
  ]
};

async function setupAlphaAI() {
  const driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
  
  try {
    console.log('🚀 Setting up Alpha AI project in Neo4j...');
    
    // Create project namespace
    console.log('📁 Creating project namespace...');
    const session = driver.session();
    
    await session.run(`
      MERGE (p:ProjectNamespace {projectId: $projectId})
      SET p.name = 'Alpha AI V1',
          p.description = 'AI education platform for Alpha Phi Alpha Fraternity',
          p.createdAt = datetime(),
          p.updatedAt = datetime()
      RETURN p
    `, { projectId: config.projectId });
    
    // Create users
    console.log('👥 Creating users...');
    for (const user of sampleData.users) {
      await session.run(`
        CREATE (u:User {
          projectId: $projectId,
          id: $id,
          name: $name,
          email: $email,
          path: $path,
          skillLevel: $skillLevel,
          interests: $interests,
          createdAt: $createdAt
        })
        RETURN u
      `, { projectId: config.projectId, ...user });
    }
    
    // Create content
    console.log('📚 Creating content...');
    for (const content of sampleData.content) {
      await session.run(`
        CREATE (c:Content {
          projectId: $projectId,
          id: $id,
          title: $title,
          description: $description,
          type: $type,
          difficulty: $difficulty,
          topics: $topics,
          duration: $duration,
          author: $author,
          createdAt: $createdAt
        })
        RETURN c
      `, { projectId: config.projectId, ...content });
    }
    
    // Create relationships
    console.log('🔗 Creating relationships...');
    for (const rel of sampleData.relationships) {
      await session.run(`
        MATCH (u:User {projectId: $projectId, id: $fromUser})
        MATCH (c:Content {projectId: $projectId, id: $toContent})
        CREATE (u)-[r:${rel.type} {
          projectId: $projectId,
          strength: $strength,
          completionRate: $completionRate,
          timestamp: $timestamp
        }]->(c)
        RETURN r
      `, { 
        projectId: config.projectId, 
        fromUser: rel.fromUser, 
        toContent: rel.toContent,
        strength: rel.strength || null,
        completionRate: rel.completionRate || null,
        timestamp: rel.timestamp
      });
    }
    
    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    await session.run(`
      CREATE INDEX user_project_id IF NOT EXISTS FOR (u:User) ON (u.projectId, u.id)
    `);
    
    await session.run(`
      CREATE INDEX content_project_id IF NOT EXISTS FOR (c:Content) ON (c.projectId, c.id)
    `);
    
    await session.run(`
      CREATE INDEX content_topics IF NOT EXISTS FOR (c:Content) ON (c.topics)
    `);
    
    await session.run(`
      CREATE INDEX user_interests IF NOT EXISTS FOR (u:User) ON (u.interests)
    `);
    
    await session.close();
    
    console.log('✅ Alpha AI project setup completed successfully!');
    console.log('');
    console.log('📈 Summary:');
    console.log(`   - Project ID: ${config.projectId}`);
    console.log(`   - Users created: ${sampleData.users.length}`);
    console.log(`   - Content items created: ${sampleData.content.length}`);
    console.log(`   - Relationships created: ${sampleData.relationships.length}`);
    console.log('');
    console.log('🔗 Connection details:');
    console.log(`   - URI: ${config.uri}`);
    console.log(`   - Username: ${config.username}`);
    console.log(`   - Browser: http://20.12.115.66:7474/browser/`);
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Configure Claude with the provided claude-config.json');
    console.log('   2. Test the MCP server with sample queries');
    console.log('   3. Integrate with your Alpha AI application');
    
  } catch (error) {
    console.error('❌ Error setting up Alpha AI project:', error);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

// Test function to verify setup
async function testSetup() {
  const driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
  
  try {
    console.log('🧪 Testing Alpha AI setup...');
    const session = driver.session();
    
    // Test query: Get users and their interests
    const result = await session.run(`
      MATCH (u:User {projectId: $projectId})
      RETURN u.name, u.path, u.interests
      ORDER BY u.name
    `, { projectId: config.projectId });
    
    console.log('👥 Users found:');
    result.records.forEach(record => {
      console.log(`   - ${record.get('u.name')} (${record.get('u.path')}): ${record.get('u.interests').join(', ')}`);
    });
    
    // Test query: Get content recommendations
    const recommendations = await session.run(`
      MATCH (u:User {projectId: $projectId})-[r:INTERESTED_IN]->(c:Content {projectId: $projectId})
      RETURN u.name, c.title, r.strength
      ORDER BY r.strength DESC
    `, { projectId: config.projectId });
    
    console.log('📚 Content recommendations:');
    recommendations.records.forEach(record => {
      console.log(`   - ${record.get('u.name')} → ${record.get('c.title')} (${record.get('r.strength')})`);
    });
    
    await session.close();
    console.log('✅ Setup test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing setup:', error);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupAlphaAI();
      break;
    case 'test':
      testSetup();
      break;
    default:
      console.log('Usage: node setup-project.js <setup|test>');
      console.log('');
      console.log('Commands:');
      console.log('  setup - Create Alpha AI project structure in Neo4j');
      console.log('  test  - Test the setup by running sample queries');
      process.exit(1);
  }
}

module.exports = { setupAlphaAI, testSetup };
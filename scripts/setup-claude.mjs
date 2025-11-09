#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { LinearClient } from '@linear/sdk';

/**
 * Setup script for integrating Linear MCP Server with Claude Desktop
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = os.platform() === 'win32';
const isMacOS = os.platform() === 'darwin';

// Get Claude Desktop config path
function getClaudeConfigPath() {
  if (isWindows) {
    return path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
  } else if (isMacOS) {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux
    return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  }
}

// Get the absolute path to the built server
function getServerPath() {
  const buildPath = path.resolve(__dirname, '..', 'build', 'index.js');

  if (!fs.existsSync(buildPath)) {
    console.log('⚠️  Build directory not found. Running npm run build...');
    try {
      const projectRoot = path.resolve(__dirname, '..');
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Build completed successfully!');

      // Verify build was created
      if (!fs.existsSync(buildPath)) {
        throw new Error('Build failed to create output files');
      }
    } catch (error) {
      throw new Error(`Failed to build project: ${error.message}\n\nPlease run 'npm run build' manually and try again.`);
    }
  }

  return buildPath;
}

// Clean and validate JSON content
function cleanJsonContent(content) {
  // Remove trailing commas before closing braces/brackets
  content = content.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove comments (if any)
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  content = content.replace(/\/\/.*$/gm, '');
  
  return content.trim();
}

// Read existing config or create new one
function readOrCreateConfig(configPath) {
  const configDir = path.dirname(configPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Read existing config or create empty one
  if (fs.existsSync(configPath)) {
    try {
      const rawContent = fs.readFileSync(configPath, 'utf8');
      const cleanContent = cleanJsonContent(rawContent);
      
      if (cleanContent) {
        const parsed = JSON.parse(cleanContent);
        return parsed;
      } else {
        console.warn('Config file is empty, creating new configuration.');
        return { mcpServers: {} };
      }
    } catch (error) {
      console.warn(`Warning: Could not parse existing config at ${configPath}. Error: ${error.message}`);
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      console.log(`Backup created at ${backupPath}`);
      console.log('Creating fresh configuration...');
      return { mcpServers: {} };
    }
  } else {
    return { mcpServers: {} };
  }
}

// Validate configuration before writing
function validateConfig(config) {
  try {
    // Test if the config can be serialized and parsed
    const jsonString = JSON.stringify(config, null, 2);
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error.message);
    return false;
  }
}

// Get Linear API key from user
function getLinearApiKey() {
  const envPath = path.resolve(__dirname, '..', '.env');
  
  // Try to read from .env file first
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/LINEAR_API_KEY\s*=\s*(.+)/);
    if (match && match[1] && match[1] !== 'your_linear_api_key_here') {
      return match[1].trim().replace(/['"]/g, ''); // Remove quotes if present
    }
  }
  
  console.log('\n🔑 Linear API Key Required');
  console.log('Please get your API key from: https://linear.app/settings/api');
  console.log('Then either:');
  console.log('1. Add it to your .env file: LINEAR_API_KEY=your_key_here');
  console.log('2. Set it as an environment variable: export LINEAR_API_KEY=your_key_here');
  console.log('3. Pass it as an argument: npm run setup:claude your_key_here\n');
  
  // Check for command line argument
  const apiKey = process.argv[2];
  if (apiKey && apiKey.length > 10) {
    return apiKey.replace(/['"]/g, ''); // Remove quotes if present
  }
  
  throw new Error('Linear API key is required. Please provide it via .env file, environment variable, or command line argument.');
}

// Verify API key by testing connection to Linear
async function verifyApiKey(apiKey) {
  try {
    console.log('\n🔍 Verifying API key...');
    const client = new LinearClient({ apiKey });
    const viewer = await client.viewer;
    const teams = await client.teams();

    return {
      success: true,
      userName: viewer.name,
      userEmail: viewer.email,
      teamCount: teams.nodes.length,
      teams: teams.nodes.map(team => ({
        id: team.id,
        name: team.name,
        key: team.key
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main setup function
async function setupClaude() {
  try {
    console.log('🚀 Setting up Linear MCP Server with Claude Desktop...\n');
    
    const configPath = getClaudeConfigPath();
    const serverPath = getServerPath();
    const apiKey = getLinearApiKey();

    console.log(`📁 Config path: ${configPath}`);
    console.log(`🔧 Server path: ${serverPath}`);
    console.log(`🔑 API key: ${apiKey.substring(0, 10)}...`);

    // Verify API key
    const verification = await verifyApiKey(apiKey);
    if (!verification.success) {
      throw new Error(`API key verification failed: ${verification.error}\n\nPlease check that your Linear API key is valid and has the necessary permissions.\nGet a new key from: https://linear.app/settings/api`);
    }

    console.log(`✅ API key verified! Hello, ${verification.userName}!`);
    console.log(`📊 Found ${verification.teamCount} team${verification.teamCount === 1 ? '' : 's'} in your workspace`);
    
    // Read or create config
    const config = readOrCreateConfig(configPath);
    
    // Ensure mcpServers exists and is an object
    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      config.mcpServers = {};
    }
    
    // Create the Linear MCP server configuration
    const linearConfig = {
      command: "node",
      args: [serverPath],
      env: {
        LINEAR_API_KEY: apiKey
      }
    };
    
    // Add Linear MCP server
    config.mcpServers.linear = linearConfig;
    
    // Validate the configuration before writing
    if (!validateConfig(config)) {
      throw new Error('Generated configuration is invalid');
    }
    
    // Write config back with proper formatting
    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, configJson, 'utf8');
    
    // Verify the written file can be read back
    try {
      const verification = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ Configuration file validated successfully');
    } catch (verifyError) {
      throw new Error(`Failed to verify written configuration: ${verifyError.message}`);
    }
    
    console.log('\n✅ Successfully configured Linear MCP Server with Claude Desktop!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart Claude Desktop application:');
    if (isMacOS) {
      console.log('   • Press Cmd+Q to quit Claude Desktop completely');
      console.log('   • Reopen Claude Desktop from Applications');
    } else if (isWindows) {
      console.log('   • Right-click the Claude icon in system tray and select "Quit"');
      console.log('   • Reopen Claude Desktop from Start menu');
    } else {
      console.log('   • Close Claude Desktop completely (not just minimize)');
      console.log('   • Reopen Claude Desktop from your application launcher');
    }
    console.log('2. Look for Linear tools in the MCP tools panel');

    // Show personalized examples based on user's teams
    if (verification.teams && verification.teams.length > 0) {
      console.log('\n💡 Try these personalized examples:');
      const firstTeam = verification.teams[0];
      console.log(`   • "Show me all issues in the ${firstTeam.name} team"`);
      console.log(`   • "Create a new bug report in ${firstTeam.name}"`);
      console.log('   • "What issues are assigned to me?"');
      if (verification.teams.length > 1) {
        const secondTeam = verification.teams[1];
        console.log(`   • "Search for high-priority issues in ${secondTeam.name}"`);
      }

      console.log('\n📊 Your teams:');
      verification.teams.forEach(team => {
        console.log(`   • ${team.name} (${team.key}) - ID: ${team.id}`);
      });
    } else {
      console.log('3. Try asking Claude: "Search for issues in Linear" or "Create a new issue"');
    }

    console.log('\n🔧 All 9 tools available:');
    console.log('   • search_issues - Search and filter Linear issues');
    console.log('   • create_issue - Create new issues in Linear');
    console.log('   • update_issue - Modify existing issues (title, description, assignee, priority, state)');
    console.log('   • get_issue - Retrieve a specific issue by ID');
    console.log('   • get_my_issues - Get issues assigned to you');
    console.log('   • get_teams - List all teams in the workspace');
    console.log('   • get_workflow_states - List workflow states for a team');
    console.log('   • add_comment - Add comments to issues');
    console.log('   • health_check - Verify API connectivity');

    console.log(`\n📝 Configuration written to: ${configPath}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure Claude Desktop is not running during setup');
    console.error('2. Check that you have write permissions to the config directory');
    console.error('3. Verify your Linear API key is valid');
    console.error('4. Try manually removing the config file and running setup again');
    process.exit(1);
  }
}

// Run setup
(async () => {
  await setupClaude();
})(); 
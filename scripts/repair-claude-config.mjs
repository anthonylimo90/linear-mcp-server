#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

/**
 * Repair script for fixing malformed Claude Desktop configuration files
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

// Advanced JSON cleaning and repair
function repairJsonContent(content) {
  console.log('🔧 Attempting to repair JSON content...');
  
  // Remove trailing commas before closing braces/brackets
  content = content.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  content = content.replace(/\/\/.*$/gm, '');
  
  // Fix common issues with quotes
  content = content.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Remove any trailing commas at the end of objects/arrays
  content = content.replace(/,(\s*[}\]])/g, '$1');
  
  return content.trim();
}

// Validate and repair configuration
function validateAndRepairConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    console.log('📄 No configuration file found. Creating a new one...');
    return { mcpServers: {} };
  }
  
  console.log(`📁 Reading configuration from: ${configPath}`);
  const rawContent = fs.readFileSync(configPath, 'utf8');
  
  if (!rawContent.trim()) {
    console.log('📄 Configuration file is empty. Creating a new one...');
    return { mcpServers: {} };
  }
  
  console.log('📋 Original content length:', rawContent.length);
  
  // Try to parse as-is first
  try {
    const config = JSON.parse(rawContent);
    console.log('✅ Configuration is already valid JSON');
    return config;
  } catch (originalError) {
    console.log('⚠️  Configuration has JSON syntax errors:', originalError.message);
  }
  
  // Attempt repair
  try {
    const repairedContent = repairJsonContent(rawContent);
    const config = JSON.parse(repairedContent);
    
    console.log('✅ Successfully repaired JSON configuration');
    console.log('📝 Repaired content length:', repairedContent.length);
    
    return config;
  } catch (repairError) {
    console.error('❌ Could not repair JSON configuration:', repairError.message);
    
    // Create backup and start fresh
    const backupPath = `${configPath}.backup.${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    console.log(`💾 Backup created at: ${backupPath}`);
    console.log('🆕 Creating fresh configuration...');
    
    return { mcpServers: {} };
  }
}

// Main repair function
function repairClaudeConfig() {
  try {
    console.log('🚀 Claude Desktop Configuration Repair Tool\n');
    
    const configPath = getClaudeConfigPath();
    console.log(`📁 Config path: ${configPath}`);
    
    // Read and repair the configuration
    const config = validateAndRepairConfig(configPath);
    
    // Ensure proper structure
    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      config.mcpServers = {};
      console.log('🔧 Added missing mcpServers section');
    }
    
    // Validate the final configuration
    try {
      const configJson = JSON.stringify(config, null, 2);
      JSON.parse(configJson); // Validate it can be parsed again
      
      // Write the repaired configuration
      fs.writeFileSync(configPath, configJson, 'utf8');
      
      console.log('\n✅ Configuration repaired successfully!');
      console.log(`📝 Configuration written to: ${configPath}`);
      
      // Show current MCP servers
      const serverNames = Object.keys(config.mcpServers);
      if (serverNames.length > 0) {
        console.log('\n🔧 Current MCP servers:');
        serverNames.forEach(name => {
          console.log(`   • ${name}`);
        });
      } else {
        console.log('\n📝 No MCP servers configured yet');
        console.log('💡 Run "npm run setup:claude" to add the Linear MCP server');
      }
      
    } catch (validationError) {
      throw new Error(`Configuration validation failed: ${validationError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Repair failed:', error.message);
    console.error('\n🔧 Manual fix required:');
    console.error('1. Close Claude Desktop');
    console.error('2. Delete the configuration file manually');
    console.error('3. Run "npm run setup:claude" to create a fresh configuration');
    process.exit(1);
  }
}

// Run repair
repairClaudeConfig(); 
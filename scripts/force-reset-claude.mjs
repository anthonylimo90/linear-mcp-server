#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

/**
 * Force reset Claude Desktop configuration - completely removes and recreates the config file
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
    throw new Error(`Server build not found at ${buildPath}. Please run 'npm run build' first.`);
  }
  return buildPath;
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
  
  // Check for command line argument
  const apiKey = process.argv[2];
  if (apiKey && apiKey.length > 10) {
    return apiKey.replace(/['"]/g, ''); // Remove quotes if present
  }
  
  throw new Error('Linear API key is required. Please provide it via .env file or as a command line argument.');
}

// Force reset function
function forceResetClaude() {
  try {
    console.log('🚀 Force Reset Claude Desktop Configuration...\n');
    
    const configPath = getClaudeConfigPath();
    const serverPath = getServerPath();
    const apiKey = getLinearApiKey();
    
    console.log(`📁 Config path: ${configPath}`);
    console.log(`🔧 Server path: ${serverPath}`);
    console.log(`🔑 API key: ${apiKey.substring(0, 10)}...`);
    
    // Create config directory if it doesn't exist
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(`📁 Created config directory: ${configDir}`);
    }
    
    // Create backup if file exists
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      console.log(`💾 Backup created: ${backupPath}`);
      
      // Remove existing file
      fs.unlinkSync(configPath);
      console.log('🗑️  Removed existing configuration file');
    }
    
    // Create completely new configuration
    const config = {
      mcpServers: {
        linear: {
          command: "node",
          args: [serverPath],
          env: {
            LINEAR_API_KEY: apiKey
          }
        }
      }
    };
    
    // Write the new configuration with explicit formatting
    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, configJson + '\n', 'utf8');
    
    console.log('✅ Created fresh configuration file');
    
    // Verify the file was written correctly
    const verification = fs.readFileSync(configPath, 'utf8');
    try {
      const parsed = JSON.parse(verification);
      console.log('✅ Configuration file validated successfully');
      
      // Show file size and content preview
      console.log(`📋 File size: ${verification.length} bytes`);
      console.log('📄 Content preview:');
      console.log(verification.substring(0, 200) + (verification.length > 200 ? '...' : ''));
      
    } catch (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }
    
    console.log('\n✅ Claude Desktop configuration reset successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Close Claude Desktop completely (quit the application)');
    console.log('2. Wait 5 seconds');
    console.log('3. Restart Claude Desktop');
    console.log('4. Check if Linear tools appear in the available tools');
    console.log('\n🔧 If you still see errors:');
    console.log('1. Check Claude Desktop logs for more details');
    console.log('2. Try restarting your computer');
    console.log('3. Check that the build directory exists and has the right permissions');
    
  } catch (error) {
    console.error('❌ Force reset failed:', error.message);
    console.error('\n🔧 Manual steps to try:');
    console.error('1. Close Claude Desktop completely');
    console.error('2. Delete the config file manually:');
    console.error(`   rm "${getClaudeConfigPath()}"`);
    console.error('3. Restart Claude Desktop to see if it creates a fresh config');
    console.error('4. Then run this script again');
    process.exit(1);
  }
}

// Run force reset
forceResetClaude(); 
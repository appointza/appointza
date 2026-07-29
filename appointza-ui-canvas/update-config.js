#!/usr/bin/env node

// Script to easily update configuration in build directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '../appointzabuild/wwwroot');
const configPath = path.join(buildDir, 'config.js');

// Default production configuration
const defaultConfig = {
  baseurl: 'https://appointza.com',
  templateBaseUrl: 'https://appointza.com/template',
  production: true,
  debugMode: false,
  googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',
  razorpayKeyId: 'rzp_live_RCRKKPVDZ3tLDv',
  razorpayKeySecret: 'cLvDMGMb9AWeggkxTbs5qZms',
  razorpayTestMode: false,
  appTitle: 'Appointza',
  version: '1.0.0',
  features: {
    enableDebugLogs: false,
    enableAnalytics: true,
    enableErrorReporting: true
  }
};

// Get command line arguments
const args = process.argv.slice(2);
const config = { ...defaultConfig };

// Parse command line arguments
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'baseurl') {
    config.baseurl = value;
    config.templateBaseUrl = value + '/template';
  } else if (key === 'production') {
    config.production = value === 'true';
    config.debugMode = !config.production;
  } else if (key in config) {
    config[key] = value;
  }
}

// Generate config.js content
const configContent = `// Configuration file - you can change these values without rebuilding
window.APP_CONFIG = ${JSON.stringify(config, null, 2)};
`;

// Write config file
try {
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Configuration updated successfully!');
  console.log('📁 Config file location:', configPath);
  console.log('🔧 Current configuration:');
  console.log(JSON.stringify(config, null, 2));
} catch (error) {
  console.error('❌ Error updating configuration:', error);
}

// Usage examples
if (args.length === 0) {
  console.log('\n📖 Usage examples:');
  console.log('node update-config.js --baseurl https://your-domain.com');
  console.log('node update-config.js --baseurl https://your-domain.com --production true');
  console.log('node update-config.js --razorpayKeyId rzp_live_xxxxxxxxxxxxx');
}

/**
 * run-prebuild.js
 * 
 * Safely executes npx expo prebuild followed by our gradle version patching.
 * Using a Node script avoids issues with shell operators (like `&&` or `;`) 
 * on different platforms (EAS Linux vs local Windows), ensuring the build command
 * can be spawned directly by the EAS runner without crashing.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('[run-prebuild] Running: npx expo prebuild --clean');
  // Run expo prebuild and inherit stdout/stderr
  execSync('npx expo prebuild --clean', { stdio: 'inherit' });
  
  console.log('[run-prebuild] Running: node patch-gradle-after-prebuild.js');
  // Run gradle patch script and inherit stdout/stderr
  execSync('node patch-gradle-after-prebuild.js', { stdio: 'inherit' });
  
  console.log('[run-prebuild] Prebuild and patch stages completed successfully!');
} catch (error) {
  console.error('[run-prebuild] Error during prebuild execution:', error.message);
  process.exit(1); // Fail the build if any step fails
}

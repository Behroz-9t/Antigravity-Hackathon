#!/usr/bin/env node
/**
 * postinstall.js
 * 
 * Patches @react-native/gradle-plugin to use Gradle 8.8 instead of 8.14.3.
 * react-native@0.81.5 ships with gradle-8.14.3 which does NOT exist on
 * EAS Build servers, causing "Gradle build failed with unknown error".
 * 
 * Gradle 8.8 is the version supported by Expo SDK 54 and pre-cached on EAS.
 * 
 * This script runs automatically after every `npm install` via the
 * `postinstall` hook in package.json.
 */

const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'node_modules/@react-native/gradle-plugin/gradle/wrapper/gradle-wrapper.properties',
];

const BAD_VERSION = 'gradle-8.14.3-bin.zip';
const GOOD_VERSION = 'gradle-8.8-bin.zip';

let patched = 0;
for (const relPath of filesToPatch) {
  const fullPath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`[postinstall] Skipping (not found): ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(BAD_VERSION)) {
    const fixed = content.replace(new RegExp(BAD_VERSION.replace(/\./g, '\\.'), 'g'), GOOD_VERSION);
    fs.writeFileSync(fullPath, fixed, 'utf8');
    console.log(`[postinstall] Patched Gradle version: ${BAD_VERSION} → ${GOOD_VERSION} in ${relPath}`);
    patched++;
  } else if (content.includes(GOOD_VERSION)) {
    console.log(`[postinstall] Already patched: ${relPath}`);
  } else {
    console.log(`[postinstall] Unknown Gradle version in: ${relPath}`);
  }
}

if (patched > 0) {
  console.log(`[postinstall] ✓ Applied ${patched} Gradle patch(es)`);
} else {
  console.log('[postinstall] No patches needed');
}

/**
 * patch-gradle-after-prebuild.js
 * 
 * Modifies the generated android/gradle/wrapper/gradle-wrapper.properties
 * to use gradle-8.8-bin.zip instead of any hallucinated or incorrect versions.
 * 
 * This is run immediately after `npx expo prebuild --clean` on the EAS server
 * (or during local builds) to ensure Gradle is built with version 8.8.
 */

const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, 'android/gradle/wrapper/gradle-wrapper.properties');

if (!fs.existsSync(targetPath)) {
  console.error(`[patch-gradle] Error: Target file not found: ${targetPath}`);
  process.exit(0); // Don't fail the build if file doesn't exist, just in case
}

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  console.log(`[patch-gradle] Found gradle-wrapper.properties`);

  // Regex to match any gradle version (e.g. gradle-8.14.3-bin.zip or gradle-8.14.3-all.zip)
  const regex = /gradle-[0-9.]+-bin\.zip/g;
  
  if (content.match(regex)) {
    content = content.replace(regex, 'gradle-8.8-bin.zip');
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log(`[patch-gradle] Successfully patched distributionUrl to use gradle-8.8-bin.zip`);
  } else {
    // If it doesn't match the specific regex, let's look for distributionUrl line
    const lines = content.split('\n');
    let modified = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('distributionUrl=')) {
        lines[i] = 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.8-bin.zip';
        modified = true;
        break;
      }
    }
    if (modified) {
      fs.writeFileSync(targetPath, lines.join('\n'), 'utf8');
      console.log(`[patch-gradle] Successfully replaced distributionUrl with gradle-8.8-bin.zip`);
    } else {
      console.log(`[patch-gradle] WARNING: Could not find distributionUrl to replace.`);
    }
  }
} catch (error) {
  console.error(`[patch-gradle] Error patching gradle: ${error.message}`);
}

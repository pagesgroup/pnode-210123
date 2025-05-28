const fs = require('fs');
const path = require('path');

function writeToJSON(dataArray, directory, filename, config) {
  const jsonFilename = filename.replace(/\.csv$/i, '.json');
  const outputDir = config.paths.outputJsonFolder;
  const fullPath = path.join(outputDir, jsonFilename);

  // Zorg dat de outputmap bestaat
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Schrijf de data (overschrijft altijd!)
  try {
    fs.writeFileSync(fullPath, JSON.stringify(dataArray, null, 2), 'utf8');
    console.log(`💾 JSON geschreven (overschreven): ${fullPath}`);
  } catch (e) {
    console.error(`❌ Fout bij schrijven JSON naar ${fullPath}:`, e.message);
  }
}

module.exports = { writeToJSON };

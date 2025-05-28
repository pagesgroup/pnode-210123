const fs = require('fs');
const path = require('path');

function ensureInit(config) {
  let wasAnythingChanged = false;

  // 🔹 1. Zorg dat de outputJsonFolder bestaat (bv. voor jobChange/rejects/finishedCartons)
  const outputJsonFolder = config.paths.outputJsonFolder;
  if (!fs.existsSync(outputJsonFolder)) {
    fs.mkdirSync(outputJsonFolder, { recursive: true });
    console.log(`[Init] 📁 Output JSON folder aangemaakt: ${outputJsonFolder}`);
    wasAnythingChanged = true;
  }

  const requiredJsonFiles = [
    config.schemas.jobChange.filename.replace('.csv', '.json'),
    config.schemas.rejects.filename.replace('.csv', '.json'),
    config.schemas.finishedCartons.filename.replace('.csv', '.json')
  ];

  requiredJsonFiles.forEach(filename => {
    const fullPath = path.join(outputJsonFolder, filename);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '[]');
      console.log(`[Init] 📄 JSON bestand aangemaakt: ${fullPath}`);
      wasAnythingChanged = true;
    }
  });

  // 🔹 2. Zorg dat FinishedJobs.json en ValidJobs.json bestaan in baseData
  const datafiles = config.paths.datafiles;
  const baseData = config.paths.baseData;

  Object.entries(datafiles).forEach(([key, relativePath]) => {
    const fullPath = path.join(baseData, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '[]');
      console.log(`[Init] 📄 Data bestand '${key}' aangemaakt in baseData: ${fullPath}`);
      wasAnythingChanged = true;
    }
  });

  return wasAnythingChanged;
}

module.exports = { ensureInit };

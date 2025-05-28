const fs = require('fs');
const path = require('path');
const os = require('os');

// 📦 JSON naar CSV functie
function saveJsonToCsvFile(topic, jsonString, csvPaths) {
  try {
    const data = JSON.parse(jsonString);
    const type = topic.split('/').pop();
    const target = csvPaths[type];
    if (!target) {
      console.warn(`⚠️ Geen mapping voor topic: ${topic}`);
      return;
    }

    const { headers } = target;
    const baseFileName = path.parse(target.path).name;
    const folder = path.dirname(target.path);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15);
    const filePath = path.join(folder, `${baseFileName}_${timestamp}.csv`);

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const rows = Array.isArray(data) ? data : [data];
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map(h => row[h] ?? '').join(',');
      csvLines.push(values);
    }

    fs.writeFileSync(filePath, csvLines.join(os.EOL) + os.EOL, 'utf8');
    console.log(`✅ Nieuw CSV-bestand aangemaakt: ${filePath}`);
  } catch (e) {
    console.error(`❌ Fout bij verwerken JSON naar CSV:`, e.message);
  }
}


module.exports = { saveJsonToCsvFile };

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const mqtt = require('mqtt');
const os = require('os');
const { ensureInit } = require('./src/init/createFileStruct');
const { readCsvJobInfo } = require('./src/data-proccesing/csvProcessor');
const { saveJsonToCsvFile } = require('./src/utils/writeToCSV.js');

// 📥 Configuratie laden
const configPath = path.resolve(__dirname, '../config/config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

// 🔧 Resolving extra paths
config.resolvedPaths = {
  validJobs: path.join(config.paths.baseData, config.paths.datafiles.validJobs)
};

// ✅ Init folders aanmaken
if (ensureInit(config)) {
  console.log('✅ Initialization performed successfully (folders/files checked/created).');
} else {
  console.log('✅ Initialization check complete. No new folders/files needed or an error occurred during init.');
}

// 🗂 Paden naar CSV-bestanden
const csvPaths = {
  jobchange: {
    path: path.join(config.paths.baseFile, 'JobChange', 'JobChange.csv'),
    headers: ['DateTime', 'JobID', 'JobRun', 'MaterialID', 'LBLNAME']
  },
  rejects: {
    path: path.join(config.paths.baseFile, 'Rejects', 'Rejects.csv'),
    headers: ['DateTime', 'JobID', 'RejectReasonCode', 'Quantity']
  },
  finishedcartons: {
    path: path.join(config.paths.baseFile, 'FinishedCartons', 'FinishedCartons.csv'),
    headers: ['DateTime', 'JobID', 'FinishedCartons', 'BoxQtyActual']
  }
};

// 🌐 MQTT Setup
const options = { port: 1883 };
const client = mqtt.connect('mqtt://aliconnect.nl', options);
const mqttpath = 'polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA/to-pnode/';

client.on('connect', () => {
  console.log('✅ Verbonden met MQTT broker');
const topicRoot = 'polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA';
client.subscribe(`${topicRoot}/to-aspect/#`, (err) => {
  if (!err) {
    console.log('📡 Geabonneerd op ' + topicRoot + '/to-aspect/#');
  }
});

  const interval = config.vnode_Server?.csvPollingIntervalMs || 40000;
  setInterval(() => {
    console.log('🕒 Start CSV-verwerking en publicatie...');
    readCsvJobInfo(config);
    try {
      const validJobs = JSON.parse(fs.readFileSync(config.resolvedPaths.validJobs, 'utf8'));
      const message = {
        rows: validJobs,
        log: new Date().toISOString()
      };
      client.publish(mqttpath + 'batchdata', JSON.stringify(message), (err) => {
        if (!err) {
          console.log('✅ Bericht verzonden via MQTT.');
        } else {
          console.error('❌ Fout bij verzenden via MQTT:', err);
        }
      });
    } catch (err) {
      console.error('❌ Fout bij lezen van ValidJobs.json:', err);
    }
  }, interval);
});

client.on('message', (topic, message) => {
  console.log(`📨 Ontvangen op ${topic}: ${message.toString()}`);
  saveJsonToCsvFile(topic, message.toString(), csvPaths); // ✅ csvPaths meegeven
});

client.on('error', (error) => {
  console.error('❌ Verbindingsfout met MQTT broker:', error);
});

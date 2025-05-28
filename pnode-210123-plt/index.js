const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const mqtt = require('mqtt');
const { readJsonFile } = require('./src/utils/fileUtils');
const { tcpMessageHandeler } = require('./src/data-proccesing/tcpMessageHandeler.js');
const tcpServer = require('./src/communication/tcpServer');
const { ensureInit } = require('./src/init/createFileStruct'); // ✅ toegevoegd

const configPath = path.resolve(__dirname, '../config/config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
// ✅ Voeg hier de absolute paden toe
config.resolvedPaths = {
  validJobs: path.join(config.paths.baseDataPLT, config.paths.datafiles.validJobs),
  finishedJobs: path.join(config.paths.baseDataPLT, config.paths.datafiles.finishedJobs)
};


// ✅ Init uitvoeren
if (ensureInit(config)) {
  console.log('✅ Init uitgevoerd: mappen/bestanden gecontroleerd of aangemaakt.');
} else {
  console.log('ℹ️ Init check uitgevoerd: alles bestond al of geen actie nodig.');
}

// 🌐 MQTT instellingen
const options = {
  port: 1883,
};


const mqttPathBase = 'polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA/aspect/read/';
const client = mqtt.connect('mqtt://aliconnect.nl', options);

// 🔁 JSON-bestanden koppelen aan MQTT-topics
const fileTopicMap = [
  {
    filePath: path.join(config.paths.outputJsonFolder, config.schemas.jobChange.filename.replace('.csv', '.json')),
    topic: mqttPathBase + 'jobchange'
  },
  {
    filePath: path.join(config.paths.outputJsonFolder, config.schemas.rejects.filename.replace('.csv', '.json')),
    topic: mqttPathBase + 'rejects'
  },
  {
    filePath: path.join(config.paths.outputJsonFolder, config.schemas.finishedCartons.filename.replace('.csv', '.json')),
    topic: mqttPathBase + 'finishedcartons'
  }
];


// 🔌 MQTT connectie en periodiek versturen van JSON-bestanden
client.on('connect', () => {
  console.log('✅ Verbonden met MQTT broker');

  const interval = config.vnode_Server?.jsonPublishIntervalMs || 30000;

  setInterval(() => {
    fileTopicMap.forEach(({ filePath, topic }) => {
      const data = readJsonFile(filePath);
      if (data) {
        client.publish(topic, JSON.stringify(data), (err) => {
          if (err) {
            console.error(`❌ Fout bij verzenden naar topic "${topic}":`, err);
          } else {
            console.log(`📤 JSON verstuurd naar "${topic}" vanuit "${filePath}"`);
          }
        });
      } else {
        console.warn(`⚠️ Geen data gevonden in "${filePath}"`);
      }
    });
  }, interval);
});

client.on('message', (topic, message) => {
  console.log(`📨 Ontvangen op ${topic}: ${message.toString()}`);
  writeToJSON(topic, message.toString());
});

client.on('error', (error) => {
  console.error('❌ Verbindingsfout MQTT:', error);
});

// 🔧 TCP-servers opstarten en berichten verwerken
const plcServer = new tcpServer(
  'PLT',
  (msg) => tcpMessageHandeler(msg, config),
  {
    ip: config.vnode_Server.ip,
    port: config.vnode_Server.port_PLT
  }
);

const boxPackingServer = new tcpServer(
  'BoxPacking',
  (msg) => tcpMessageHandeler(msg, config),
  {
    ip: config.vnode_Server.ip,
    port: config.vnode_Server.port_BP
  }
);

// 🚀 Start servers
plcServer.start();
boxPackingServer.start();

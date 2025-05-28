const options = {
  port: 1883,
  // protocol: 'mqtts', // Let op de 's' voor SSL/TLS
  // username: 'jouwGebruikersnaam', // optioneel
  // password: 'jouwWachtwoord',     // optioneel
  // key: KEY,                       // optioneel
  // cert: CERT,                     // optioneel
  // ca: CA,                         // optioneel
  // rejectUnauthorized: false  // Alleen voor testen — zet dit op true in productie met geldige certs
};

const mqtt = require('mqtt');

// Verbind met een MQTT broker (bijv. een publieke broker of je eigen)
const client  = mqtt.connect('mqtt://aliconnect.nl', options);

// Bij succesvolle verbinding
client.on('connect', function () {
  console.log('Verbonden met MQTT broker');
  return;

  // Abonneer op een topic
  client.subscribe('huis/woonkamer/temperatuur', function (err) {
    if (!err) {
      console.log('Geabonneerd op topic: huis/woonkamer/temperatuur');







      // Publiceer een bericht naar het topic
      client.publish('huis/woonkamer/temperatuur', '23.5');
    }
  });
});

// Bericht ontvangen van een subscribed topic
client.on('message', function (topic, message) {
  // message is een Buffer
  console.log(`Ontvangen op ${topic}: ${message.toString()}`);
});

// Foutafhandeling
client.on('error', function (error) {
  console.error('Verbindingsfout:', error);
});


const plcServer = new tcpServer(
  'PLT', // Server name for logging and identification
  (msg) => { tcpMessageHandeler(msg, config); }, // Handler for incoming messages
  { // Server connection options
    ip: config.vnode_Server.ip,
    port: config.vnode_Server.port_PLT
  }
);

const boxPackingServer = new tcpServer(
  'BoxPacking', // Server name for logging and identification
  (msg) => { tcpMessageHandeler(msg, config); }, // Handler for incoming messages
  { // Server connection options
    ip: config.vnode_Server.ip,
    port: config.vnode_Server.port_BP
  }
);

// Start both TCP servers. They will begin listening for incoming connections.
plcServer.start();
boxPackingServer.start();

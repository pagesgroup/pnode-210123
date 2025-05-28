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
const path = 'polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA/aspect/';

// Bij succesvolle verbinding
client.on('connect', function () {
  console.log('Verbonden met MQTT broker');
  // Abonneer op een topic
  client.subscribe(path+'#', function (err) {
    if (!err) {
      console.log('Geabonneerd op '+path);
      // Publiceer een bericht naar het topic

      (function checkfile(){
        const rows = [
          {
            a:1,
            b:2,
          },
          {
            a:1,
            b:2,
          },
        ];
        const data = {
          rows,
          log: new Date().toISOString(),
        }
        client.publish(path+'batchdata', JSON.stringify(data), function (err) {
          if (!err) {
            console.log('Bericht succesvol verzonden!');
          } else {
            console.error('Fout bij verzenden:', err);
          }

          // Sluit de verbinding na verzenden
          // client.end();
        });
        setTimeout(e => checkfile(),3000);
      })()
      return;
    }
  });
});

// Bericht ontvangen van een subscribed topic
client.on('message', function (topic, message) {
  // message is een Buffer
  console.log(`Ontvangen op ${topic}: ${message.toString()}`);
  switch (topic) {
    case '': {
      
    }
  }
});

// Foutafhandeling
client.on('error', function (error) {
  console.error('Verbindingsfout:', error);
});


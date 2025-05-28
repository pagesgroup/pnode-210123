const fs = require('fs');
const YAML = require('yaml');
const mqtt = require('mqtt');
const csv = require('csv-parser');

async function init() {
  try {
    console.log('Initializing configuration...');
    const configFileContent = await fs.promises.readFile('./config.yaml', 'utf8');
    const config = YAML.parse(configFileContent);
    console.log('Configuration loaded from config.yaml');

    const csvFilePath = config.csv && config.csv.file_path;
    if (!csvFilePath) {
      console.error('Error: CSV file path not defined in config.yaml under csv.file_path');
      throw new Error('CSV file path not defined in config.yaml');
    }

    await fs.promises.access(csvFilePath, fs.constants.F_OK);
    console.log(`CSV file found at ${csvFilePath}`);
    return config;
  } catch (error) {
    if (error.code === 'ENOENT' && error.path === './config.yaml') {
      console.error('Error: Configuration file (config.yaml) not found.');
    } else if (error.code === 'ENOENT') {
      console.error(`Error: CSV file not found at ${error.path}`);
    } else {
      console.error('Error during initialization:', error.message);
    }
    throw error; // Re-throw to be caught by the IIFE
  }
}

async function processCsvData(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    const requiredFields = ['JobID', 'MaterialID', 'ScheduleIndex', 'Quantity', 'Timestamp'];

    console.log(`Processing CSV file: ${filePath}`);
    fs.createReadStream(filePath)
      .pipe(csv({ headers: true, skipEmptyLines: true }))
      .on('data', (row) => {
        const isValid = requiredFields.every(field => row[field] && row[field].trim() !== '');
        if (isValid) {
          records.push(row);
        } else {
          console.warn(`Skipping invalid row (missing or empty essential fields): ${JSON.stringify(row)}`);
        }
      })
      .on('end', () => {
        console.log('CSV file successfully processed.');
        resolve({
          rows: records,
          log: new Date().toISOString()
        });
      })
      .on('error', (error) => {
        console.error('Error reading or parsing CSV file:', error);
        reject(error);
      });
  });
}

(async () => {
  let config;
  try {
    config = await init();
  } catch (error) {
    console.error('Initialization failed. Exiting.');
    process.exit(1);
  }

  let jsonData;
  try {
    jsonData = await processCsvData(config.csv.file_path);
  } catch (error) {
    console.error(`Error processing CSV data: ${error.message}. Exiting.`);
    process.exit(1);
  }

  const options = {
    port: config.mqtt.port || 1883,
    username: config.mqtt.username, // Optional
    password: config.mqtt.password, // Optional
  };

  const client = mqtt.connect(config.mqtt.broker_url, options);
  const baseTopic = config.mqtt.topic;

  client.on('connect', function () {
    console.log('Verbonden met MQTT broker');
    
    // No longer subscribing for this task, directly publishing.
    // If subscription is needed later, it can be added back.
    // client.subscribe(baseTopic + '/#', function (err) { ... });

    console.log(`Publishing data to MQTT topic: ${baseTopic}`);
    client.publish(baseTopic, JSON.stringify(jsonData), function (err) {
      if (!err) {
        console.log(`Bericht succesvol verzonden naar ${baseTopic}`);
      } else {
        console.error(`Fout bij verzenden naar ${baseTopic}:`, err);
      }
      // Close the client connection after publishing
      console.log('Closing MQTT connection.');
      client.end();
    });
  });

  // Bericht ontvangen van een subscribed topic (can be removed if no subscription)
  client.on('message', function (topic, message) {
    // message is een Buffer
    console.log(`Ontvangen op ${topic}: ${message.toString()}`);
  });

  // Foutafhandeling
  client.on('error', function (error) {
    console.error('Verbindingsfout MQTT:', error);
    // Consider exiting if connection error occurs before publish
    if (!client.connected && !client.disconnecting) {
        console.error('MQTT client could not connect. Exiting.');
        process.exit(1);
    }
  });
})();


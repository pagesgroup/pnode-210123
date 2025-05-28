const url = new URL(document.location);
const mqttbroker = url.searchParams.get('mqttbroker') || 'aliconnect.nl';
const mqttport = +url.searchParams.get('mqttport') || 1884;
const useSSL = true;//url.searchParams.get('ssl') ? true : false;
const path = 'polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA';
function setValue(topic, value) {
  const message = new Paho.MQTT.Message(String(value));
  message.destinationName = topic;
  mqttClient.send(message);
}
var mqttClient = new Paho.MQTT.Client(mqttbroker, mqttport, "myclientid_" + parseInt(Math.random() * 100, 10));
 mqttClient.onConnectionLost = function(responseObject) {
  console.error("connection lost: " + responseObject.errorMessage);
};
mqttClient.onMessageArrived = function(message) {
  const {destinationName,payloadString} = message;
  const selector = destinationName.split(path).pop();
  switch (selector) {
    case '/aspect/batchdata': {
      const data = JSON.parse(payloadString);
      console.log(data);
      $(document.body).clear().append(
        $('pre').text(JSON.stringify(data,null,2)),
      )
    }
  }
  console.debug(selector, '=', payloadString);
};
var options = {
  useSSL,
  timeout: 3,
  onSuccess(e) {
    console.log("mqtt connected",this);
    mqttClient.subscribe(`${path}/#`, { qos: 1 });
  },
  onFailure(message) {
    console.log("Connection failed: " + message.errorMessage);
  }
};
mqttClient.connect(options);

pnode = {
  app: {

  }
}
const url = new URL(document.location);
const mqttbroker = url.searchParams.get('mqttbroker') || 'aliconnect.nl';
const mqttport = +url.searchParams.get('mqttport') || 1884;
const useSSL = true;//url.searchParams.get('ssl') ? true : false;
const path = 'polymac/210123-53084127-A96C-4D2C-9835-90E684BE06EA';

function setValue(topic, value) {
  const message = new Paho.MQTT.Message(typeof value == 'object' ? JSON.stringify(value) : String(value));
  message.destinationName = path+topic;
  mqttClient.send(message);
}
var mqttClient = new Paho.MQTT.Client(mqttbroker, mqttport, "myclientid_" + parseInt(Math.random() * 100, 10));
 mqttClient.onConnectionLost = function(responseObject) {
  console.error("connection lost: " + responseObject.errorMessage);
};
let rows = [];
mqttClient.onMessageArrived = function(message) {
  const {destinationName,payloadString} = message;
  const selector = destinationName.split(path).pop();
  // console.debug(selector, '=', payloadString);
  console.debug(selector);
  switch (selector) {
    case '/aspect/jobchange': {
      const data = JSON.parse(payloadString);
      console.debug({data});
      $('#jobchange').text(data.JobID,data.DataCount);
      return;
    }
    case '/aspect/batchdata': {
      const data = JSON.parse(payloadString);
      console.debug({data});
      rows = data.rows;
      // console.debug({rows});
      $('table>tbody').clear().append(
        rows.map(row => $('tr').append(
          $('td').text(row.JobID),
          $('td').text(row.JobRun),
          $('td').text(row.DesiredYield),
          $('td').text(row.MaterialID),
          $('td').text(row.ScheduleIndex),
          $('td').text(row.LBLBARCODE),
          $('td').text(row.LBLNAME),
          $('td').text(row.IMLBARCODE),
          $('td').text(row.IMLBARCODELOC),
          $('td').text(row.Status),
        ))
      );
      return;
    }
  }
};
var options = {
  useSSL,
  timeout: 3,
  onSuccess(e) {
    console.log("mqtt connected",this);
    mqttClient.subscribe(`${path}/#`, { qos: 1 });
    (function jobDone(){
      const row = rows.shift();
      if (row) {
        setValue('/aspect/jobchange', {
          DataCount: 13,
          JobID: row.JobID,
        });
        setValue('/aspect/batchdata', {
          rows,
          source: 'Job Change',
        })
      }
      setTimeout(jobDone, 5000);
    })()
  },
  onFailure(message) {
    console.log("Connection failed: " + message.errorMessage);
  }
};
mqttClient.connect(options);

pnode = {
  plt: {
    init() {
      $(document.body).append(
        // $('nav').append(
        //   $('button').text('Test'),
        // ),
        $('main').append(
          $('div').id('jobchange'),
          $('table').class('grid').style('white-space:nowrap;').append(
            $('thead').append(
              $('th').text('JobID'),
              $('th').text('JobRun'),
              $('th').text('DesiredYield'),
              $('th').text('MaterialID'),
              $('th').text('ScheduleIndex'),
              $('th').text('LBLBARCODE'),
              $('th').text('LBLNAME'),
              $('th').text('IMLBARCODE'),
              $('th').text('IMLBARCODELOC'),
              $('th').text('Status'),
            ),
            $('tbody'),
          ),
        ),
      )
    },
  }
}

window.addEventListener('load', e => pnode.plt.init());

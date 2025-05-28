const path = require('path');
const net = require('net');
const fs = require('fs');
const yaml = require('js-yaml');
const os = require('os');

const config = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../config/config.yaml'), 'utf8'));
const tcpClient = require(path.resolve(__dirname, '../communication/tcpClient'));
const tcpServer = require(path.resolve(__dirname, '../communication/tcpServer'));

const simSettings = config.simulatorSettings || {};
const CSV_WRITE_PATH = simSettings.csvPath || path.resolve(__dirname, '../../data/BatchData.csv');
const INITIAL_JOB_ID = simSettings.initialJobId || 'FirstJobChangeRequest';

const JOB_CHANGE_INTERVAL_MS = simSettings.jobChangeIntervalMs || 70000;
const BOX_INFO_REQ_INTERVAL_MS = simSettings.boxInfoRequestIntervalMs || 5000;
const FINISHED_CARTONS_INTERVAL_MS = simSettings.finishedCartonsIntervalMs || 5000;
const REJECTS_INTERVAL_MS = simSettings.rejectsIntervalMs || 5000;
const MES_CSV_WRITE_INTERVAL_MS = simSettings.mesCsvWriteIntervalMs || 15000;

function _padToFixedLength(text, length) {
  return String(text).substring(0, length).padEnd(length);
}

let activeSimulatedJobID = _padToFixedLength(INITIAL_JOB_ID, 40);
let previousSimulatedJobID = activeSimulatedJobID;
let isJobIDUsedInCycle = true;

let pltMessageCounter = 1;
let bpMessageCounter = 1;

let currentBoxQty = 10;
let currentFinishedQty = 10;
let currentRejectQty = 1;

function _formatShortNumber(val) {
  return _padToFixedLength(String(val), 4);
}

function _getSimulatedJobChangeMsg() {
  return `Jobchange             no:${_padToFixedLength(pltMessageCounter, 8)}${activeSimulatedJobID}`;
}
function _getSimulatedBoxInfoMsg() {
  return `RequestBoxInfo        no:${_padToFixedLength(bpMessageCounter, 8)}${activeSimulatedJobID}`;
}
function _getSimulatedRejectsMsg() {
  return `Rejects               no:${activeSimulatedJobID} SimReasonCode ${_formatShortNumber(currentRejectQty)}`;
}
function _getSimulatedFinishedCartonsMsg() {
  return `FinishedCart          no:${_padToFixedLength(bpMessageCounter, 8)}${_formatShortNumber(currentBoxQty)}${_formatShortNumber(currentFinishedQty)}${activeSimulatedJobID}`;
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function _randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function _normalizeJobID(jobId) {
  if (typeof jobId !== 'string') return '';
  return jobId.replace(/\u2013|\u2014/g, '-').replace(/[^\x20-\x7E]/g, '').trim();
}

async function runDeviceSimulationLoop() {
  while (true) {
    tcpClient(_getSimulatedJobChangeMsg(), {
      ip: config.vnode_Server.ip,
      port: config.vnode_Server.port_PLT,
      source: 'SimJobChangeSender'
    });
    pltMessageCounter++;
    await _sleep(BOX_INFO_REQ_INTERVAL_MS);

    tcpClient(_getSimulatedBoxInfoMsg(), {
      ip: config.vnode_Server.ip,
      port: config.vnode_Server.port_BP,
      source: 'SimBoxInfoSender'
    });
    bpMessageCounter++;

    const productionCycles = _randInt(1, 3);
    for (let cycle = 0; cycle < productionCycles; cycle++) {
      const finishedCount = _randInt(1, 2);
      for (let f = 0; f < finishedCount; f++) {
        tcpClient(_getSimulatedFinishedCartonsMsg(), {
          ip: config.vnode_Server.ip,
          port: config.vnode_Server.port_BP,
          source: 'SimFinishedCartonsSender'
        });
        bpMessageCounter++;
        currentBoxQty += _randInt(0,1);
        currentFinishedQty += _randInt(5,15);
        await _sleep(FINISHED_CARTONS_INTERVAL_MS);
      }

      const rejectCount = _randInt(0, 3);
      if (rejectCount > 0) {
        tcpClient(_getSimulatedRejectsMsg(), {
          ip: config.vnode_Server.ip,
          port: config.vnode_Server.port_PLT,
          source: 'SimRejectsSender'
        });
        pltMessageCounter++;
        currentRejectQty += _randInt(0,2);
        await _sleep(REJECTS_INTERVAL_MS);
      }
    }

    await _sleep(JOB_CHANGE_INTERVAL_MS - (BOX_INFO_REQ_INTERVAL_MS + productionCycles * (FINISHED_CARTONS_INTERVAL_MS + REJECTS_INTERVAL_MS)));
  }
}

const simPltServer = new tcpServer('SimulatedPLTServer', (msg) => {
  const trimmedMsg = msg.trim();
  const jobInfoMatch = trimmedMsg.match(/^jobinfo:\s*(.*)/i);
  if (jobInfoMatch && jobInfoMatch[1]) {
    const receivedRawJobID = _normalizeJobID(jobInfoMatch[1].substring(0, 40));
    const newActiveJobID = _padToFixedLength(receivedRawJobID, 40);
    if (newActiveJobID && newActiveJobID !== activeSimulatedJobID) {
      previousSimulatedJobID = activeSimulatedJobID;
      activeSimulatedJobID = newActiveJobID;
      isJobIDUsedInCycle = false;
      currentBoxQty = _randInt(1, 3);
      currentFinishedQty = _randInt(10, 42);
      currentRejectQty = _randInt(1, 3);
    }
  }
}, { ip: config.PLT_Server.ip, port: config.PLT_Server.port });

const simBoxPackingServer = new tcpServer('SimulatedBoxPackingServer', (msg) => {
  console.log(`[SimBoxPackingServer] ⬅️ Received: "${msg.trim()}"`);
}, { ip: config.BP_Server.ip, port: config.BP_Server.port });

const BATCH_DATA_CSV_HEADERS = [
  "JobID", "JobRun", "DesiredYield", "MaterialID", "ScheduleIndex",
  "ResinCode", "MasterbatchCode", "IMLCode", "WorkOrderID", "MachineID",
  "LBLTYPE", "PalletQty", "MODE", "LBLBARCODE", "LBLITEMNUMB",
  "LBLNAME", "LBLNSN", "IMLBARCODE", "IMLBARCODELOC", "LBLNATO", "LBLJSD"
];

function _generateRandomJobID() {
  return `SIM${Math.floor(Math.random() * 100000)}-C${_randInt(100,999)}M-HDWHIML-A${_randInt(100,999)}`;
}

function _generateCsvRow() {
  const imlBarcodeLocOptions = ["T", "B", "N"];
  return [
    _generateRandomJobID(),
    _randInt(1, 5),
    _randInt(1000, 99999),
    `MaterialID_SIM_${_randInt(100, 999)}`,
    _randInt(1, 100),
    "RVHDX0010_ResinCode_SIM",
    "MGFMWH002_MasterbatchCode_SIM",
    `IMLC${_randInt(100,999)}M-ADMIL-SIM${_randInt(0,9)}`,
    `WO_3000${_randInt(1000, 9999)}`,
    "MC_SIM_042",
    _randInt(0, 1) < 0.5 ? "TypeA_SIM" : "TypeB_SIM",
    _randInt(1000, 2400),
    _randInt(1,3),
    `LBLBARCODE_SIM_${_randInt(1000, 999999)}`,
    `LBLITEMNUMB_SIM_${_randInt(1, 1000)}`,
    `SimLabelName_${String.fromCharCode(65 + _randInt(0,25))}`,
    `NSN_SIM_${_randInt(1,1000)}`,
    `IMLBARCODE_SIM_${_randInt(1000, 9999)}`,
    imlBarcodeLocOptions[_randInt(0, imlBarcodeLocOptions.length - 1)],
    `NATO_SIM_${_randInt(1,1000)}`,
    `JSD_SIM_${_randInt(1,1000)}`
  ];
}

function _writeRowToBatchDataCsv(rowData) {
  const csvLine = rowData.join(',') + os.EOL;
  const dirPath = path.dirname(CSV_WRITE_PATH);

  try {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    if (!fs.existsSync(CSV_WRITE_PATH)) fs.writeFileSync(CSV_WRITE_PATH, BATCH_DATA_CSV_HEADERS.join(',') + os.EOL, 'utf8');
    fs.appendFileSync(CSV_WRITE_PATH, csvLine, 'utf8');
    console.log(`[MES Sim] ➕ Job toegevoegd: ${rowData[0]}`);
  } catch (error) {
    console.error(`[MES Sim] ❌ CSV schrijf-fout:`, error.message);
  }
}

function startMesSimulation() {
  _writeRowToBatchDataCsv(_generateCsvRow());
  setInterval(() => _writeRowToBatchDataCsv(_generateCsvRow()), MES_CSV_WRITE_INTERVAL_MS);
}

simPltServer.start();
simBoxPackingServer.start();
runDeviceSimulationLoop();
startMesSimulation();

const path = require('path');
const fs = require('fs');
const { getTimestamp, readJsonFile } = require('../utils/fileUtils');
const { updateJobStatusesOnJobChange, buildJobChangeMessage } = require('./jobChangeHelper');
const tcpClient = require('../communication/tcpClient');
const { insertOrUpdateFinishedCarton } = require('./insertOrUpdateFinishedCarton');
const { writeToJSON } = require('../utils/writeToJSON');

let lastFinishedJobID = null;

function _getCurrentJob(config) {
  const jobs = readJsonFile(config.resolvedPaths.validJobs);
  if (!jobs) return null;
  return jobs.find(j => j.Status === 'Current') || null;
}

function _getLogFilePathInfo(config, folderKey, schemaKey, defaultFilename) {
  const folderPath = config.paths.folders[folderKey];
  const fullDirectoryPath = path.join(config.paths.baseFile, folderPath || 'unknown_logs');
  const schemaFilename = config.schemas[schemaKey]?.filename;
  return {
    directory: fullDirectoryPath,
    filename: (schemaFilename || defaultFilename).replace('.csv', '.json')
  };
}

function _getTimeStamp_PLC() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}  ${String(now.getMinutes()).padStart(2, '0')}  ${String(now.getSeconds()).padStart(2, '0')}`;
}

function tcpMessageHandeler(msg, config) {
  const command = msg.trim().split(/\s+/)[0].toUpperCase();

  switch (command) {
    case 'JOBCHANGE': {
      console.log('🔄 TCP Action Received: JOBCHANGE');
      updateJobStatusesOnJobChange(config);
      const job = _getCurrentJob(config);
      if (!job) break;

      const jobChangeData = {
        DateTime: getTimestamp('log'),
        JobID: job.JobID || '',
        JobRun: job.JobRun || '',
        MaterialID: job.MaterialID || '',
        LBLNAME: job.LBLNAME || ''
      };

      insertOrUpdateFinishedCarton(config.resolvedPaths.finishedJobs, config.finishedCartons, {
        startTime: getTimestamp('log'),
        JobID: job.JobID
      });

      const { directory, filename } = _getLogFilePathInfo(config, 'jobChange', 'jobChange', 'JobChange.csv');
      writeToJSON([jobChangeData], directory, filename, config);

      const jobMsgToPlc = buildJobChangeMessage(config);
      tcpClient(jobMsgToPlc, { ip: config.PLT_Server.ip, port: config.PLT_Server.port, source: 'JobChange' });
      console.log(`📤 Sent JobChange message to PLC for JobID: ${job.JobID}`);
      break;
    }

    case 'REJECTS': {
      console.log('📦 TCP Action Received: REJECTS');

      const { directory, filename } = _getLogFilePathInfo(config, 'rejects', 'rejects', 'Rejects.csv');
      const parts = msg.replace(/\s+/g, ' ').trim().split(' ');
      let jobID = '', reason = '0', qty = '0';

      if (parts.length >= 4) {
        const jobParts = (parts[1] || '').split(':');
        if (jobParts.length === 2 && jobParts[0].toLowerCase() === 'no') {
          jobID = jobParts[1];
        }
        reason = parts[2];
        qty = parts[3];
      }

      const data = {
        DateTime: getTimestamp('log'),
        JobID: jobID,
        RejectReasonCode: reason,
        Quantity: qty
      };

      if (jobID) {
        insertOrUpdateFinishedCarton(config.resolvedPaths.finishedJobs, config.finishedCartons, {
          JobID: jobID,
          rejectQty: qty
        });
      }

      writeToJSON([data], directory, filename, config);
      break;
    }

    case 'FINISHEDCART': {
      console.log('📦 TCP Action Received: FINISHEDCARTONS');

      const { directory, filename } = _getLogFilePathInfo(config, 'finishedCartons', 'finishedCartons', 'FinishedCartons.csv');
      const parts = msg.replace(/\s+/g, ' ').trim().split(' ');
      let jobID = '', boxQty = '0', finished = '0';

      if (parts.length >= 5) {
        jobID = parts[2];
        finished = parts[3];
        boxQty = parts[4];
      }

      const data = {
        DateTime: getTimestamp('log'),
        JobID: jobID,
        BoxQtyActual: boxQty,
        FinishedCartons: finished
      };

      if (lastFinishedJobID && lastFinishedJobID !== jobID) {
        insertOrUpdateFinishedCarton(config.resolvedPaths.finishedJobs, config.finishedCartons, {
          JobID: lastFinishedJobID,
          endTime: getTimestamp('log')
        });
      }

      lastFinishedJobID = jobID;

      if (jobID) {
        insertOrUpdateFinishedCarton(config.resolvedPaths.finishedJobs, config.finishedCartons, {
          JobID: jobID,
          finishedCartons: finished,
          boxQtyActual: boxQty
        });
      }

      writeToJSON([data], directory, filename, config);
      break;
    }

    case 'REQUESTBOXINFO': {
      console.log('📦 TCP Action Received: REQUESTBOXINFO');
      updateJobStatusesOnJobChange(config);

      const job = _getCurrentJob(config);
      if (!job) break;

      const p = config.schemas.boxinfo.properties;
      const message = `Job:` +
        (job.JobID || '').padEnd(p.jobID.length) +
        (job.MaterialID || '').padEnd(p.MaterialID.length) +
        (job.LBLBARCODE || '').padEnd(p.LBLBARCODE.length) +
        (job.LBLNAME || '').padEnd(p.LBLNAME.length) +
        _getTimeStamp_PLC().padEnd(p.DateTime.length);

      tcpClient(message, {
        ip: config.BP_Server.ip,
        port: config.BP_Server.port,
        source: 'PackingInfoResponse'
      });

      console.log(`📤 Sent PackingInfo to BoxPacking server for JobID ${job.JobID}:
${message}`);
      break;
    }

    default:
      console.warn(`[TCP HANDLER] ⚠️ Unknown command received: "${command}" from message: "${msg}"`);
  }
}

module.exports = { tcpMessageHandeler };

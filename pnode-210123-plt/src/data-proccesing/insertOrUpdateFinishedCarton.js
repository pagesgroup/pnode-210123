const fs = require('fs');
const path = require('path');

/**
 * Insert or update a job record in FinishedJobs.json.
 * @param {string} filePath - Full path to the JSON file
 * @param {object} config - YAML structure with field names, e.g.: config.finishedCartons
 * @param {object} inputData - The data you want to add or update (can be partial)
 */
// Node.js file system module (though not directly used here, assumed to be used by utils).
// const fs = require('fs'); 
// Node.js path module (similarly, assumed to be used by utils if needed).
// const path = require('path'); 
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils'); // Utilities for reading/writing JSON files.

/**
 * Inserts a new job record or updates an existing one in a JSON file (typically `FinishedJobs.json`).
 * The function uses a configuration object to map provided `inputData` keys to the actual field names in the JSON file.
 * It ensures that `startTime` is never overwritten if a record already exists.
 *
 * @param {string} filePath - The full path to the JSON file (e.g., path to `FinishedJobs.json`).
 * @param {object} finishedCartonsConfig - The configuration section (e.g., `config.finishedCartons` from `config.yaml`)
 *                                         which defines the mapping of internal keys (like 'JobID', 'startTime')
 *                                         to their actual names in the JSON file (e.g., { JobID: { name: 'JobID' }, ... }).
 * @param {object} inputData - An object containing the data to be inserted or updated.
 *                             Keys in `inputData` can be either the internal keys from `finishedCartonsConfig` (e.g., 'JobID')
 *                             or the actual field names (e.g., 'JobID' if `config.finishedCartons.JobID.name` is 'JobID').
 *                             The function prioritizes values from internal keys if both are present.
 */
function insertOrUpdateFinishedCarton(filePath, finishedCartonsConfig, inputData) {
  // Read the existing data from the JSON file. If the file doesn't exist or is empty, initialize with an empty array.
  let allJobRecords = readJsonFile(filePath) || [];

  // Determine the actual field name for JobID from the configuration.
  const jobFieldName = finishedCartonsConfig.JobID.name; 
  // Extract the JobID from inputData. It tries to get it using the configured field name first,
  // then falls back to checking for a direct 'JobID' key in inputData (e.g. if inputData uses 'JobID' as key directly).
  const jobIdValue = inputData[jobFieldName] ?? inputData['JobID'] ?? null;

  // If no JobID is found in the inputData, abort the operation as JobID is crucial.
  if (!jobIdValue) {
    console.warn('[InsertOrUpdateFinishedCarton] ⚠️ No JobID provided in inputData. Insertion/update aborted.');
    return;
  }

  // Find the index of an existing record with the same JobID.
  const existingRecordIndex = allJobRecords.findIndex(entry => entry[jobFieldName] === jobIdValue);

  if (existingRecordIndex === -1) {
    // --- Case 1: New Record ---
    // If no existing record is found, create a new one.
    const newRecord = {};
    // Iterate over all configured field definitions (e.g., JobID, startTime, endTime, FinishedCartons, RejectQty).
    for (const internalKey of Object.keys(finishedCartonsConfig)) {
      const actualFieldName = finishedCartonsConfig[internalKey].name; // Get the actual field name for the current internalKey.
      // Get value from inputData: try internalKey first, then actualFieldName. Default to null if not found.
      newRecord[actualFieldName] = inputData[internalKey] ?? inputData[actualFieldName] ?? null;
    }
    allJobRecords.push(newRecord); // Add the newly created record to the array.
    console.log(`[InsertOrUpdateFinishedCarton] ✅ New record added for JobID: ${jobIdValue} to ${path.basename(filePath)}.`);
  } else {
    // --- Case 2: Update Existing Record ---
    const existingRecord = allJobRecords[existingRecordIndex]; // Get the reference to the existing record.
    let updated = false;

    // Iterate over all configured fields to update the existing record.
    for (const internalKey of Object.keys(finishedCartonsConfig)) {
      const actualFieldName = finishedCartonsConfig[internalKey].name; // Get the actual field name.

      // Critical rule: Never overwrite an existing 'startTime'.
      // 'startTime' is typically set only when the job record is first created (e.g., during JOBCHANGE).
      if (actualFieldName === finishedCartonsConfig.startDateAndTime.name && existingRecord[actualFieldName] !== null) {
        continue; 
      }

      // Determine the value from inputData. Prioritize using the internalKey, then the actualFieldName.
      let valueFromInput;
      if (inputData[internalKey] !== undefined) {
        valueFromInput = inputData[internalKey];
      } else if (inputData[actualFieldName] !== undefined) {
        valueFromInput = inputData[actualFieldName];
      } else {
        // Value is not present in inputData for this field. Skip updating this field.
        continue;
      }
      
      // Update the field in the existing record if the new value is different or if the field doesn't exist yet.
      if (existingRecord[actualFieldName] !== valueFromInput) {
        existingRecord[actualFieldName] = valueFromInput;
        updated = true;
      }
    }

    if (updated) {
      console.log(`[InsertOrUpdateFinishedCarton] 🔄 Record updated for JobID: ${jobIdValue} in ${path.basename(filePath)}.`);
    } else {
      console.log(`[InsertOrUpdateFinishedCarton] ℹ️ No changes applied to existing record for JobID: ${jobIdValue} in ${path.basename(filePath)} (data was identical or only startTime was provided).`);
    }
  }

  // Write the modified (or original, if no changes) array of records back to the JSON file.
  writeJsonFile(filePath, allJobRecords);
}

module.exports = { insertOrUpdateFinishedCarton };

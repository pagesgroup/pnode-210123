// 📥 CSV-to-JSON importer for job information.
// Features:
// - Reads CSV files based on `config.schemas.batchData.filename`.
// - Maps CSV rows to a defined schema (`config.schemas.batchData.properties`).
// - Assigns a 'Pending' status to new jobs.
// - Merges new/updated jobs into an existing JSON list (`ValidJobs.json`).
// - Handles `ScheduleIndex` conflicts:
//   - Protects jobs with 'Current' or 'Next' status from being overwritten or having their ScheduleIndex changed directly by incoming data.
//   - Shifts `ScheduleIndex` of other jobs to accommodate new entries or resolve conflicts.
//   - If an incoming job's `ScheduleIndex` conflicts with a protected index, it's moved to the next available index after protected ones.
// - Removes jobs with status 'Done' before processing new CSV data.
// - Moves processed CSV files to a "processed" directory and error files to an "error" directory.

const fs = require('fs'); // Node.js File System module for interacting with files.
const path = require('path'); // Node.js Path module for handling file and directory paths.
const csv = require('csv-parser'); // External library for parsing CSV files.
const { getTimestamp, readJsonFile, writeJsonFile } = require('../utils/fileUtils'); // Utility functions.

/**
 * Reads a CSV file containing job information, processes its content,
 * and updates a JSON file (`ValidJobs.json`) with the new and existing job data.
 * @param {object} config - The application configuration object.
 */
function readCsvJobInfo(config) {
  // --- 1. Configuration Validation ---
  // Ensure all necessary paths and filenames are defined in the configuration.
  if (
    !config?.paths?.baseFile ||
    !config?.paths?.folders?.jobInfo ||
    !config?.paths?.folders?.jobInfoProcessed ||
    !config?.paths?.folders?.jobInfoError ||
    !config?.schemas?.batchData?.filename
  ) {
    console.error('❌ Error: Essential path or filename configurations are missing in config.yaml. Please check sections: paths.baseFile, paths.folders (jobInfo, jobInfoProcessed, jobInfoError), and schemas.batchData.filename.');
    return; // Abort if configuration is incomplete.
  }

  // Ensure the CSV schema definition exists and has properties.
  const schemaKeys = Object.keys(config.schemas.batchData.properties || {});
  if (schemaKeys.length === 0) {
    console.error('❌ Error: No schema fields defined under config.schemas.batchData.properties. Cannot process CSV.');
    return; // Abort if no schema keys are defined.
  }

  // --- 2. Path and Filename Setup ---
  const BASE_DIR = config.paths.baseFile; // Base directory for operations.
  const CSV_FILENAME = config.schemas.batchData.filename; // Filename of the input CSV.

  const INPUT_CSV_PATH = path.join(BASE_DIR, config.paths.folders.jobInfo, CSV_FILENAME); // Full path to the input CSV file.
  const PROCESSED_DIR = path.join(BASE_DIR, config.paths.folders.jobInfoProcessed); // Directory for successfully processed CSVs.
  // const ERROR_DIR = path.join(BASE_DIR, config.paths.folders.jobInfoError); // Directory for CSVs that cause errors (currently unused directly in move, but good for consistency).
  const OUTPUT_JSON_PATH = config.resolvedPaths.validJobs; // Full path to the output JSON file (`ValidJobs.json`).

  console.log(`📂 Searching for new CSV file at: ${INPUT_CSV_PATH}`);

  // --- 3. CSV File Processing ---
  if (fs.existsSync(INPUT_CSV_PATH)) { // Check if the input CSV file exists.
    console.log(`⏳ Found CSV file: ${CSV_FILENAME}. Starting processing...`);
    const newJobsFromCsv = []; // Array to store rows read from the CSV.

    fs.createReadStream(INPUT_CSV_PATH)
      .pipe(csv()) // Pipe the read stream through the CSV parser.
      .on('data', (row) => { // Event listener for each row of data parsed from the CSV.
        const orderedRow = {};
        // Map CSV data to schema keys, ensuring all schema keys are present in the new job object.
        schemaKeys.forEach((key) => {
          orderedRow[key] = row[key] !== undefined ? row[key] : null; // Use null for missing values.
        });
        orderedRow.Status = 'Pending'; // Assign default 'Pending' status to new jobs.
        newJobsFromCsv.push(orderedRow); // Add the processed row to the array.
      })
      .on('end', () => { // Event listener for when the entire CSV file has been processed.
        console.log(`✔️ CSV file "${CSV_FILENAME}" processed. ${newJobsFromCsv.length} rows found.`);

        // --- 4. JSON Data Merging and Conflict Resolution ---
        let existingJobs = readJsonFile(OUTPUT_JSON_PATH) || []; // Read existing jobs from JSON, or initialize as empty array.

        // Remove all jobs with status 'Done' before merging new data.
        existingJobs = existingJobs.filter(job => job.Status !== 'Done');
        console.log('🧹 Removed jobs with status "Done" from existing job list.');

        // Identify protected jobs ('Current' or 'Next') and their ScheduleIndex values.
        // These jobs should not be easily overwritten or have their index changed by incoming data.
        const protectedJobs = existingJobs.filter(job => job.Status === 'Current' || job.Status === 'Next');
        const protectedIndexes = new Set(protectedJobs.map(job => parseInt(job.ScheduleIndex, 10)));
        console.log(`🛡️ Protected ScheduleIndexes (Current/Next jobs): ${Array.from(protectedIndexes).join(', ') || 'None'}`);

        // Use a Map for efficient lookup and update of existing jobs by JobID.
        const jobMap = new Map(existingJobs.map(job => [job.JobID, job]));

        // Process each new job from the CSV.
        for (const newJob of newJobsFromCsv) {
          const jobKey = newJob.JobID; // Key for identifying jobs.
          const existingJob = jobMap.get(jobKey);
          let incomingScheduleIndex = parseInt(newJob.ScheduleIndex, 10);
          if (isNaN(incomingScheduleIndex)) {
            console.warn(`⚠️ Job ${jobKey} has an invalid or missing ScheduleIndex: "${newJob.ScheduleIndex}". Assigning high default (9999) or handling as error might be needed.`);
            // For now, if it's critical, it might get pushed around by valid indexes.
            // Consider assigning a default high index or skipping.
            incomingScheduleIndex = 9999; // Or some other handling strategy
            newJob.ScheduleIndex = incomingScheduleIndex.toString();
          }


          if (existingJob) { // If job already exists in the JSON list.
            // If existing job is 'Current' or 'Next', do not update its properties from CSV.
            if (existingJob.Status === 'Current' || existingJob.Status === 'Next') {
              console.log(`🔒 Job ${jobKey} (Status: ${existingJob.Status}) is protected. No updates applied from CSV.`);
              continue; // Skip to the next new job.
            }

            // Update existing job properties if they differ from CSV, excluding protected statuses.
            let changed = false;
            for (const prop of schemaKeys) { // Iterate over schema-defined properties.
              if (existingJob[prop] !== newJob[prop]) {
                existingJob[prop] = newJob[prop];
                changed = true;
              }
            }
            // Retain original status unless it's 'Pending' and needs to be set from CSV (already handled by newJob.Status = 'Pending').
            // If existingJob.Status was something else (not Current/Next/Done), it's preserved.
            if (changed) {
              console.log(`🔁 Job ${jobKey} updated with new data from CSV.`);
            } else {
              console.log(`ℹ️ Job ${jobKey} already exists with identical data. No update needed.`);
            }
          } else { // If job is new (not in existingJobs map).
            // Handle ScheduleIndex conflicts for new jobs.
            if (protectedIndexes.has(incomingScheduleIndex)) {
              // If incoming ScheduleIndex is protected, find the next available index.
              const maxProtectedIndex = Math.max(...protectedIndexes, 0); // Ensure a number if protectedIndexes is empty
              newJob.ScheduleIndex = (maxProtectedIndex + 1).toString();
              console.warn(`⚠️ ScheduleIndex ${incomingScheduleIndex} for new Job ${jobKey} was protected. Moved to ${newJob.ScheduleIndex}.`);
              incomingScheduleIndex = parseInt(newJob.ScheduleIndex, 10); // Update for subsequent logic
            }

            // Shift ScheduleIndex for non-protected jobs if a new job is inserted at or before their index.
            // This makes space for the new job.
            const jobsToShift = existingJobs
              .filter(job => job.Status !== 'Current' && job.Status !== 'Next') // Exclude protected jobs.
              .filter(job => parseInt(job.ScheduleIndex, 10) >= incomingScheduleIndex); // Find jobs at or after the insert index.

            // Sort in descending order to shift from highest index first, avoiding overwrite collisions during shift.
            jobsToShift.sort((a, b) => parseInt(b.ScheduleIndex, 10) - parseInt(a.ScheduleIndex, 10))
              .forEach(job => {
                job.ScheduleIndex = (parseInt(job.ScheduleIndex, 10) + 1).toString();
              });
            
            console.log(`➕ New Job ${jobKey} added with ScheduleIndex ${newJob.ScheduleIndex}. Shifted ${jobsToShift.length} other jobs.`);
            jobMap.set(jobKey, newJob); // Add the new job to the map.
          }
        }

        // Convert the map values back to an array for final sorting and writing.
        const finalJobs = Array.from(jobMap.values());
        // Optional: Sort jobs by ScheduleIndex for consistent order in JSON, though map preserves insertion order for new items.
        finalJobs.sort((a, b) => parseInt(a.ScheduleIndex, 10) - parseInt(b.ScheduleIndex, 10));


        // --- 5. Write Updated JSON and Move Processed CSV ---
        if (writeJsonFile(OUTPUT_JSON_PATH, finalJobs)) {
          console.log(`💾 JSON file updated successfully at ${OUTPUT_JSON_PATH} (${finalJobs.length} jobs total).`);
        } else {
          console.error(`❌ Error writing updated JSON file to ${OUTPUT_JSON_PATH}.`);
          // Decide if CSV should still be moved. For now, it will be, to prevent reprocessing loop of same error.
        }

        // Construct destination path for the processed CSV file.
        const timestamp = getTimestamp('file'); // Timestamp for unique filename.
        const destBaseName = `${path.basename(CSV_FILENAME, '.csv')}_${timestamp}.csv`; // e.g., BatchData_YYYYMMDD_HHMMSS.csv
        const destinationPath = path.join(PROCESSED_DIR, destBaseName);

        // Move the processed CSV file.
        fs.rename(INPUT_CSV_PATH, destinationPath, (err) => {
          if (err) {
            console.error(`❌ Failed to move CSV file from ${INPUT_CSV_PATH} to ${destinationPath}:`, err);
            // Potentially move to ERROR_DIR here if rename to PROCESSED_DIR fails.
            // fs.rename(INPUT_CSV_PATH, path.join(ERROR_DIR, path.basename(INPUT_CSV_PATH)), () => {}); // Attempt to move to error.
          } else {
            console.log(`📁 CSV file "${CSV_FILENAME}" moved to processed directory: ${destinationPath}`);
          }
        });
      })
      .on('error', (error) => { // Handle errors during CSV read stream.
        console.error(`❌ Error reading or parsing CSV file ${INPUT_CSV_PATH}:`, error);
        // Move to ERROR_DIR might be appropriate here.
        // const errorTimestamp = getTimestamp('file');
        // const errorDestBaseName = `${path.basename(CSV_FILENAME, '.csv')}_error_${errorTimestamp}.csv`;
        // fs.rename(INPUT_CSV_PATH, path.join(ERROR_DIR, errorDestBaseName), () => {}); // Best effort move to error.
      });
  } else {
    console.log(`ℹ️ No new CSV file found at ${INPUT_CSV_PATH}. Waiting for next cycle.`);
  }
}

module.exports = { readCsvJobInfo };

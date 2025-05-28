const fs = require('fs');
const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');

// 📄 Load configuration file
// Note: Config is passed as a parameter to functions, no file loading here.

// Helper function to read and parse the ValidJobs.json file.
// Returns an object containing the jobs array and the file path, or null if an error occurs.
function _getValidJobs(config) {
  // Retrieve the full path to ValidJobs.json from the global configuration object.
  const jobStorageFile = config.resolvedPaths.validJobs;
  const jobs = readJsonFile(jobStorageFile); // Use utility to read and parse the file.

  if (!jobs) {
    // Log an error if the file cannot be read or parsed.
    console.error(`[JobChangeHelper - FileAccess] ❌ ValidJobs.json not found or is invalid at: ${jobStorageFile}`);
    return { jobs: null, path: jobStorageFile }; // Return null for jobs to indicate failure.
  }
  return { jobs, path: jobStorageFile }; // Return the parsed jobs and the path.
}

/**
 * Updates job statuses in `ValidJobs.json` upon a job change event.
 * This function implements the logic for transitioning jobs through statuses:
 * - If a 'Current' job exists, it's marked as 'Done'.
 * - If a 'Next' job exists, it's marked as 'Current'.
 * - A new 'Next' job is then selected from 'Pending' jobs based on `ScheduleIndex`.
 * - If no 'Current' or 'Next' jobs exist (e.g., initial run), the first two 'Pending' jobs are set to 'Current' and 'Next'.
 *
 * @param {object} config - The application configuration object, used to locate `ValidJobs.json`.
 * @returns {boolean} True if the status update logic completes (even if file write fails, to match previous behavior), false if a critical error occurs during processing.
 */
function updateJobStatusesOnJobChange(config) {
  try {
    const { jobs, path: jobStorageFile } = _getValidJobs(config);
    if (!jobs) {
      return false; // Error already logged by _getValidJobs.
    }

    // Filter out jobs with undefined or non-numeric ScheduleIndex and sort by ScheduleIndex.
    // This ensures a predictable order for status transitions.
    const sortedJobs = jobs
      .filter(j => j.ScheduleIndex !== undefined && !isNaN(parseInt(j.ScheduleIndex, 10)))
      .sort((a, b) => parseInt(a.ScheduleIndex, 10) - parseInt(b.ScheduleIndex, 10));

    const currentJobIndex = sortedJobs.findIndex(job => job.Status === 'Current');
    const nextJobIndex = sortedJobs.findIndex(job => job.Status === 'Next');
    const pendingJobs = sortedJobs.filter(job => job.Status === 'Pending'); // Get all pending jobs, already sorted by ScheduleIndex.

    if (currentJobIndex === -1 && nextJobIndex === -1) {
      // --- Initial State or Reset State: No 'Current' or 'Next' job ---
      // Set the first pending job to 'Current' and the second to 'Next', if available.
      if (pendingJobs.length > 0) {
        pendingJobs[0].Status = 'Current';
        console.log(`[JobChangeHelper - StatusUpdate] 🆕 Set ${pendingJobs[0].JobID} to Current (from Pending).`);
      }
      if (pendingJobs.length > 1) {
        pendingJobs[1].Status = 'Next';
        console.log(`[JobChangeHelper - StatusUpdate] 🆕 Set ${pendingJobs[1].JobID} to Next (from Pending).`);
      }
      if (pendingJobs.length === 0) {
        console.log('[JobChangeHelper - StatusUpdate] ℹ️ No Pending jobs available to set as Current or Next.');
      }
    } else {
      // --- Normal Operation: Transition existing 'Current' and 'Next' jobs ---
      if (currentJobIndex !== -1) {
        sortedJobs[currentJobIndex].Status = 'Done';
        console.log(`[JobChangeHelper - StatusUpdate] ✅ Marked ${sortedJobs[currentJobIndex].JobID} (was Current) as Done.`);
      }
      if (nextJobIndex !== -1) {
        sortedJobs[nextJobIndex].Status = 'Current';
        console.log(`[JobChangeHelper - StatusUpdate] ➡️ Promoted ${sortedJobs[nextJobIndex].JobID} (was Next) to Current.`);
      } else if (currentJobIndex !== -1 && nextJobIndex === -1) {
        // This case implies a 'Current' job existed and became 'Done', but there was no 'Next' job.
        // We still need to find a new 'Next' job from 'Pending'.
        console.log('[JobChangeHelper - StatusUpdate] ℹ️ Current job became Done, but no explicit Next job was set. Looking for a new Next from Pending list.');
      }
      
      // Find the *new* 'Next' job from the remaining 'Pending' jobs (those not already promoted).
      // Need to re-filter for 'Pending' as one might have been promoted to 'Current' if `nextJobIndex` was -1 but `currentJobIndex` was not.
      const stillPendingJobs = sortedJobs.filter(job => job.Status === 'Pending');
      if (stillPendingJobs.length > 0) {
        stillPendingJobs[0].Status = 'Next'; // The first one in sorted list becomes Next.
        console.log(`[JobChangeHelper - StatusUpdate] ⏭️ Set ${stillPendingJobs[0].JobID} to Next (from Pending).`);
      } else {
        console.log('[JobChangeHelper - StatusUpdate] ℹ️ No Pending jobs available to set as the new Next job.');
      }
    }

    // Write the updated job list (now in `sortedJobs` which references objects in `jobs`) back to the JSON file.
    if (writeJsonFile(jobStorageFile, jobs)) { // Write the original `jobs` array as it contains all jobs, including unsorted/invalid ones that were filtered out only for sorting.
      console.log('[JobChangeHelper - StatusUpdate] ✅ Job statuses updated successfully in ValidJobs.json.');
    }
    // If writeJsonFile returns false, it has already logged an error.

    // Maintain previous behavior: return true indicating logical completion,
    // even if file write might have issues (logged by writeJsonFile).
    return true;
  } catch (err) {
    console.error('[JobChangeHelper - StatusUpdate] ❌ Critical error during job status update process:', err);
    return false;
  }
}

// Local utility function to pad a string to a specific length.
// If the string is longer than the target length, it's truncated.
// If shorter, it's padded with spaces at the end.
function _padToFixedLength(text, length) {
  const str = String(text || ''); // Ensure text is a string, default to empty string if null/undefined.
  return str.padEnd(length).substring(0, length); // Pad and then truncate to ensure fixed length.
}

/**
 * Builds a fixed-format string message for a PLC system based on current and next job information.
 * The message includes details like JobID, MaterialID, labels, and yield, padded to specific lengths.
 * The order and length of fields are defined by `config.schemas.jobInfo.properties` and a predefined `fieldOrder`.
 *
 * @param {object} config - The application configuration object.
 * @returns {string|null} The formatted PLC message string, or null if an error occurs or no current/next job data is available.
 */
function buildJobChangeMessage(config) {
  try {
    const { jobs } = _getValidJobs(config); // Fetch all valid jobs.
    if (!jobs) {
      return null; // Error already logged by _getValidJobs.
    }

    // Find the job with status 'Current' and 'Next'. Default to empty objects if not found to prevent errors.
    const currentJob = jobs.find(j => j.Status === 'Current') || {};
    const nextJob = jobs.find(j => j.Status === 'Next') || {};

    // Retrieve property definitions (including fixed lengths) from the configuration.
    const jobInfoProperties = config.schemas.jobInfo.properties;

    // Define the exact order and source (current/next job) for fields in the PLC message.
    // Each object in this array specifies:
    // - `key`: The property name as defined in `ValidJobs.json` (and typically in `config.schemas.jobInfo.properties.<internalKey>.name`).
    // - `source`: Specifies whether to pull data from the `currentJob` or `nextJob`.
    // - `schemaRef`: The internal key in `config.schemas.jobInfo.properties` to find length and other attributes.
    //                If the `key` itself is the internal key, `schemaRef` can be omitted or same as `key`.
    //                This structure helps map `fieldOrder` keys to their schema definitions for length.
    // This explicit mapping ensures correct data sourcing and adherence to PLC message format.
    const fieldDefinitions = [
      // Fields from the 'Current' job
      { key: 'JobID', sourceJob: currentJob, schemaKey: 'JobIDCurrent' }, // Assuming JobIDCurrent maps to 'JobID' name
      { key: 'MaterialID', sourceJob: currentJob, schemaKey: 'MaterialID' },
      { key: 'LBLNAME', sourceJob: currentJob, schemaKey: 'LBLNAME' },
      { key: 'LBLBARCODE', sourceJob: currentJob, schemaKey: 'LBLBARCODECurrent' },
      { key: 'IMLBARCODE', sourceJob: currentJob, schemaKey: 'IMLBARCODECurrent' },
      { key: 'IMLBARCODELOC', sourceJob: currentJob, schemaKey: 'IMLBARCODELOCCurrent' },
      { key: 'DesiredYield', sourceJob: currentJob, schemaKey: 'DesiredYieldCurrent' },
      
      // Fields from the 'Next' job
      { key: 'JobID', sourceJob: nextJob, schemaKey: 'JobIDNext' },
      { key: 'LBLBARCODE', sourceJob: nextJob, schemaKey: 'LBLBARCODENext' },
      { key: 'IMLBARCODE', sourceJob: nextJob, schemaKey: 'IMLBARCODENext' },
      { key: 'IMLBARCODELOC', sourceJob: nextJob, schemaKey: 'IMLBARCODELOCNext' },
      { key: 'DesiredYield', sourceJob: nextJob, schemaKey: 'DesiredYieldNext' },
      
      // DateTime field (not typically from current/next job object, but generated or static)
      // The original code had 'dateTime' in fieldOrder, but not explicitly from current/next.
      // Assuming it should be the actual 'DateTime' field from the schema if it's meant to be dynamic.
      // For now, let's assume it's a placeholder or needs specific handling if it's a timestamp.
      // If 'DateTime' is a property of jobInfoProperties and has a length, it would be handled.
      // The original code's `source[key]` for 'dateTime' would likely be undefined.
      // Let's map it to a schema key if one exists for a generic timestamp or similar.
      // For this example, I'll assume 'DateTime' is a key in jobInfoProperties for its length.
      { key: 'DateTime', sourceJob: {}, schemaKey: 'DateTime' } // Source is empty obj, value will be empty unless default handled.
    ];

    // Build the message by retrieving each field, padding/truncating it, and joining.
    const paddedFields = fieldDefinitions.map(def => {
      // The actual name of the field in the job object (e.g. 'JobID', 'MaterialID')
      // This relies on the 'name' property within the schema definition.
      const propertySchema = jobInfoProperties[def.schemaKey];
      if (!propertySchema) {
        console.warn(`[JobChangeHelper - MessageBuild] ⚠️ Schema definition not found for schemaKey: ${def.schemaKey} (mapped from key: ${def.key}). Using default length 10.`);
        return _padToFixedLength(def.sourceJob[def.key], 10); // Fallback length
      }
      const fieldNameInJobObject = propertySchema.name || def.key; // Use defined name, fallback to key
      const value = def.sourceJob[fieldNameInJobObject] || ''; // Get value from the specified source job.
      const length = propertySchema.length; // Get defined length from schema.
      return _padToFixedLength(value, length);
    });

    // Log the new Current and Next job details for verification.
    // This uses the state of `jobs` array *after* potential status updates if called sequentially.
    const finalCurrentJob = jobs.find(j => j.Status === 'Current') || {};
    const finalNextJob = jobs.find(j => j.Status === 'Next') || {};
    console.log('[JobChangeHelper - MessageBuild] 👉 Status for outgoing PLC message:');
    console.log(`  ✅ Current: JobID=${finalCurrentJob.JobID || 'N/A'}, MaterialID=${finalCurrentJob.MaterialID || 'N/A'}, Yield=${finalCurrentJob.DesiredYield || 'N/A'}`);
    console.log(`  ⏭️  Next:    JobID=${finalNextJob.JobID || 'N/A'}, MaterialID=${finalNextJob.MaterialID || 'N/A'}, Yield=${finalNextJob.DesiredYield || 'N/A'}`);

    // Retrieve the message prefix from config, with a fallback.
    const messagePrefix = config.messagePrefixes.send.jobChangeInfo || 'job:';
    
    // Combine all padded fields into a single string, prefixed as required.
    return messagePrefix + paddedFields.join('');

  } catch (err) {
    console.error('[JobChangeHelper - MessageBuild] ❌ Error generating PLC message:', err);
    return null;
  }
}

module.exports = {updateJobStatusesOnJobChange, buildJobChangeMessage};

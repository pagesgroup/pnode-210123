// Node.js 'fs' module for file system operations (e.g., checking existence, creating directories/files).
const fs = require('fs');
// Node.js 'path' module for working with file and directory paths.
const path = require('path');

/**
 * ✅ Ensure all necessary folders and JSON data files exist
 * @param {object} config - The complete config.yaml loaded in vnode.js
 * @returns {boolean} - True if anything was created
 */
// Redundant require statements already removed by previous edit, this is just to confirm the state.
// const fs = require('fs');
// const path = require('path');

/**
 * ✅ Ensures that all necessary application folders and initial JSON data files exist based on the provided configuration.
 * If folders or files are missing, they will be created.
 * JSON files are initialized with an empty array (`[]`) if created.
 *
 * @param {object} config - The complete application configuration object (loaded from `config.yaml`).
 *                          This object must contain `paths.baseFile`, `paths.baseData`,
 *                          `paths.folders`, and `paths.datafiles` structures.
 * @returns {boolean} - True if any folder or file was created during the process, false otherwise.
 */
function ensureInit(config) {
  // --- 0. Validate Critical Configuration Paths ---
  if (!config.paths) {
    console.error("Error in ensureInit: config.paths is missing.");
    return false;
  }
  if (!config.paths.baseFile || typeof config.paths.baseFile !== 'string' || config.paths.baseFile.trim() === '') {
    console.error("Error in ensureInit: config.paths.baseFile is missing or not a valid string.");
    return false;
  }
  if (!config.paths.baseData || typeof config.paths.baseData !== 'string' || config.paths.baseData.trim() === '') {
    console.error("Error in ensureInit: config.paths.baseData is missing or not a valid string.");
    return false;
  }

  // Extract relevant path configurations for easier access.
  const baseFileDir = config.paths.baseFile; // Base directory for general application structure (e.g., where 'Logging', 'JobInfo' might be subfolders).
  const baseDataDir = config.paths.baseData; // Base directory specifically for data files (e.g., where 'ValidJobs.json' is stored).
  const folderDefinitions = config.paths.folders; // Object defining various application subfolders relative to `baseFileDir`.
  const dataFileDefinitions = config.paths.datafiles; // Object defining data files relative to `baseDataDir`.

  let wasAnythingChanged = false; // Flag to track if any file system modifications occur.

  // --- 1. Create Application Folders (based on `config.paths.baseFile`) ---
  // Iterate over each folder defined in `config.paths.folders`.
  Object.entries(folderDefinitions).forEach(([folderKey, relativePath]) => {
    // Construct the full absolute path for the folder.
    const fullPath = path.join(baseFileDir, relativePath);
    // Check if the folder already exists.
    if (!fs.existsSync(fullPath)) {
      // If not, create the folder. The `recursive: true` option ensures that parent directories are also created if they don't exist.
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`[Init] 📁 Folder '${folderKey}' created at: ${fullPath}`);
      wasAnythingChanged = true; // Set flag as a change was made.
    }
  });

  // --- 2. Create Initial Data Files and Their Directories (based on `config.paths.baseData`) ---
  // Iterate over each data file defined in `config.paths.datafiles`.
  Object.entries(dataFileDefinitions).forEach(([fileKey, relativeFilePath]) => {
    // Construct the full absolute path for the data file.
    const fullFilePath = path.join(baseDataDir, relativeFilePath);
    // Get the directory part of the data file's path.
    const directoryOfFile = path.dirname(fullFilePath);

    // Check if the directory for the data file exists.
    if (!fs.existsSync(directoryOfFile)) {
      // If not, create the directory. This is important for files nested in subdirectories of `baseDataDir`.
      fs.mkdirSync(directoryOfFile, { recursive: true });
      console.log(`[Init] 📁 Directory for data file '${fileKey}' created at: ${directoryOfFile}`);
      wasAnythingChanged = true; // Set flag as a change was made.
    }

    // Check if the data file itself exists.
    if (!fs.existsSync(fullFilePath)) {
      // If not, create the file and initialize it with an empty JSON array "[]".
      // This ensures that parts of the application expecting a JSON array will not fail on first run.
      fs.writeFileSync(fullFilePath, '[]');
      console.log(`[Init] 📄 Data file '${fileKey}' created with initial content "[]" at: ${fullFilePath}`);
      wasAnythingChanged = true; // Set flag as a change was made.
    }
  });

  // Return true if any folders or files were created, false otherwise.
  return wasAnythingChanged;
}

module.exports = { ensureInit }; // Export the function for use in other modules.

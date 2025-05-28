// Node.js 'fs' module for file system operations.
const fs = require('fs');
// Node.js 'path' module for working with file and directory paths.
const path = require('path');
// Node.js 'os' module for operating system-specific functionalities, like EOL (End Of Line).
const os = require('os');
// Import getTimestamp from local fileUtils.
const { getTimestamp } = require('./fileUtils');

/**
 * Writes an array of row data to a new CSV file. A timestamp is appended to the base filename
 * to ensure uniqueness for each call, preventing overwrites of previous logs.
 * The CSV delimiter can be configured via the `config` object; defaults to ','.
 *
 * @param {string[]} headers - An array of strings representing the column headers for the CSV file.
 * @param {object[]} rowDataArray - An array of objects, where each object represents a row.
 *                                  The keys in these objects should correspond to the headers.
 * @param {string} folderPath - The absolute path to the directory where the CSV file will be saved.
 * @param {string} baseFileName - The base name for the CSV file (e.g., "Rejects_Log").
 *                                The final filename will be like "Rejects_Log_YYYY-MM-DDTHH-MM-SS-MSZ.csv".
 * @param {object} [config={}] - The application configuration object. Used to fetch `csvSettings.delimiter`.
 *                               Defaults to an empty object if not provided, causing delimiter to use fallback.
 */
function writeToCSV(headers, rowDataArray, folderPath, baseFileName, config = {}, withTime) {
  // --- Input Validation ---
  if (!Array.isArray(rowDataArray) || rowDataArray.length === 0) {
    console.error('[WriteToCSV] ❌ No data rows provided. CSV file will not be created.');
    return;
  }
  if (!Array.isArray(headers) || headers.length === 0) {
    console.error('[WriteToCSV] ❌ No headers provided for CSV. CSV file will not be created.');
    return;
  }
  if (!folderPath || typeof folderPath !== 'string') {
    console.error('[WriteToCSV] ❌ Invalid folderPath provided. CSV file will not be created.');
    return;
  }
   if (!baseFileName || typeof baseFileName !== 'string') {
    console.error('[WriteToCSV] ❌ Invalid baseFileName provided. CSV file will not be created.');
    return;
  }

  // --- Filename and Path Construction ---
  // Generate a timestamp string suitable for filenames using the 'file' format from getTimestamp.
  const timestamp = getTimestamp('file');
  // Extract only the name part of baseFileName, stripping any extension it might accidentally have.
  const nameOnly = path.parse(baseFileName).name;
  // Construct the final timestamped filename.
  const timestampedFileName = `${nameOnly}_${timestamp}.csv`;
  // Construct the full absolute path to the new CSV file.
  const fullPath = path.join(folderPath, timestampedFileName);

  // --- CSV Delimiter Configuration ---
  // Use delimiter from config if available, otherwise default to comma.
  const delimiter = config?.csvSettings?.delimiter || ',';


  try {
    // --- Directory Creation ---
    // Ensure the target folder exists. If not, create it recursively.
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`[WriteToCSV] 📁 Target folder created: ${folderPath}`);
    }

    // --- CSV Content Generation ---
    // Map each data row object to a CSV string row.
    // For each header, find the corresponding value in the row object.
    // If a value is null or undefined, use an empty string. Join values with the delimiter.
    const csvRows = rowDataArray.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle cases where value might be null, undefined, or needs escaping if it contains the delimiter or quotes.
        // Basic handling: ensure it's a string and default to empty if null/undefined.
        // More advanced CSV escaping (e.g., for quotes within fields) is not implemented here but could be added.
        return value !== null && value !== undefined ? String(value) : '';
      }).join(delimiter)
    );

    // Combine headers and data rows into a single CSV content string, using OS-specific EOL.
    const csvContent = [
      headers.join(delimiter), // Header row
      ...csvRows                 // Data rows
    ].join(os.EOL);

    // --- File Writing ---
    // Write the CSV content to the file using UTF-8 encoding. Append an EOL at the end of the file.
    fs.writeFileSync(fullPath, csvContent + os.EOL, 'utf8');

    console.log(`[WriteToCSV] ✅ CSV file created: ${timestampedFileName} at ${folderPath} with ${rowDataArray.length} data row(s) using '${delimiter}' as delimiter.`);

  } catch (error) {
    console.error(`[WriteToCSV] ❌ Error writing CSV file ${timestampedFileName} to ${folderPath}:`, error.message);
  }
}

module.exports = { writeToCSV };

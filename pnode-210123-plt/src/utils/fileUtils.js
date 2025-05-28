// Node.js 'fs' module for file system operations.
const fs = require('fs');
// Node.js 'path' module for working with file and directory paths (though not directly used in this version of the file, it's often a companion to fs).
// const path = require('path'); 

/**
 * Generates a timestamp string in a specified format.
 *
 * @param {string} [format='file'] - The desired format for the timestamp.
 *                                   'file': ISO string with colons and periods replaced by hyphens (suitable for filenames).
 *                                   'log': ISO string truncated to seconds, with 'T' replaced by underscore (YYYY-MM-DD_HH:MM:SS).
 *                                   Any other value: Full ISO string.
 * @returns {string} The formatted timestamp string.
 */
const getTimestamp = (format = 'file') => {
  const now = new Date();
  if (format === 'file') {
    // Example: 2023-10-27T14-30-55-123Z (colons and decimal part of seconds replaced by hyphens)
    return now.toISOString().replace(/[:.]/g, '-');
  } else if (format === 'log') {
    // Example: 2023-10-27_14:30:55 (ISO string up to seconds, 'T' replaced by '_')
    return now.toISOString().slice(0, 19).replace('T', '_');
  }
  // Default: Full ISO string, e.g., 2023-10-27T14:30:55.123Z
  return now.toISOString();
};

/**
 * Reads a JSON file and parses its content.
 *
 * @param {string} filePath - The full path to the JSON file.
 * @returns {object|Array|null} The parsed JSON object or array, or null if the file doesn't exist or an error occurs during reading/parsing.
 *                              Logs a warning if the file is not found, or an error if reading/parsing fails.
 */
const readJsonFile = (filePath) => {
  // Check if the file exists before attempting to read.
  if (!fs.existsSync(filePath)) {
    console.warn(`[FileUtils - ReadJSON] ⚠️ File not found: ${filePath}. Returning null.`);
    return null; // Return null if file does not exist.
  }
  try {
    // Read the file content as a UTF-8 string.
    const rawData = fs.readFileSync(filePath, 'utf8');
    // Parse the string data into a JavaScript object or array.
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`[FileUtils - ReadJSON] ❌ Error reading or parsing JSON file ${filePath}:`, error.message);
    return null; // Return null if any error occurs during reading or parsing.
  }
};

/**
 * Writes JavaScript data (object or array) to a JSON file.
 * The JSON data is pretty-printed with an indentation of 2 spaces.
 *
 * @param {string} filePath - The full path to the file where JSON data will be written.
 * @param {object|Array} data - The JavaScript data to be stringified and written to the file.
 * @returns {boolean} True if the file was written successfully, false otherwise.
 *                    Logs an error if writing fails.
 */
const writeJsonFile = (filePath, data) => {
  try {
    // Stringify the JavaScript data to a JSON formatted string.
    // `null, 2` enables pretty-printing with 2-space indentation for readability.
    const jsonData = JSON.stringify(data, null, 2);
    // Write the JSON string to the specified file using UTF-8 encoding.
    fs.writeFileSync(filePath, jsonData, 'utf8');
    // Optional success log: console.log(`[FileUtils - WriteJSON] 💾 JSON data written successfully to ${filePath}`);
    return true; // Indicate success.
  } catch (error) {
    console.error(`[FileUtils - WriteJSON] ❌ Error writing JSON data to ${filePath}:`, error.message);
    return false; // Indicate failure.
  }
};

// Export the utility functions for use in other modules.
module.exports = { getTimestamp, readJsonFile, writeJsonFile };

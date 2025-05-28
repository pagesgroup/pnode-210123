// Node.js 'net' module provides an asynchronous network API for creating TCP servers and clients.
const net = require('net');

/**
 * 📤 Sends a message to a target server using TCP/IP.
 * This function establishes a connection, sends a message, logs relevant events,
 * and handles basic errors, timeouts, and responses.
 *
 * @param {string} message - The ASCII message to be sent. Must be a non-empty string.
 * @param {object} target - An object containing the target server's details.
 * @param {string} target.ip - The IP address of the target server.
 * @param {number} target.port - The port number of the target server.
 * @param {string} [target.source='Unknown'] - An optional name for the source of the message, used for logging purposes.
 *                                             Example: { ip: '192.168.0.10', port: 31864, source: 'JobChangeHandler' }
 */
function tcpClient(message, { ip, port, source = 'UnknownSource' }) { // Changed default source for clarity
  // Validate the message: it must be a non-empty string.
  if (!message || typeof message !== 'string' || message.length === 0) {
    console.warn(`[TCP Client - ${source}] ⛔ Message is empty or invalid. Transmission canceled.`);
    return; // Abort if message is invalid.
  }

  // Validate IP and Port
  if (!ip || typeof ip !== 'string') {
    console.warn(`[TCP Client - ${source}] ⛔ Invalid IP address provided: ${ip}. Transmission canceled.`);
    return;
  }
  if (!port || typeof port !== 'number' || port <= 0 || port > 65535) {
    console.warn(`[TCP Client - ${source}] ⛔ Invalid port number provided: ${port}. Transmission canceled.`);
    return;
  }

  // Create a new TCP socket instance.
  const client = new net.Socket();
  
  // Set a timeout for the connection. If no activity occurs for 3000ms (3 seconds),
  // the 'timeout' event will be triggered.
  // TODO: Consider making this timeout value configurable if different systems require different responsiveness.
  const connectionTimeout = 3000;
  client.setTimeout(connectionTimeout);

  // Event handler for connection timeout.
  client.on('timeout', () => {
    console.warn(`[TCP Client - ${source}] ⏱️ Connection to ${ip}:${port} timed out after ${connectionTimeout / 1000}s.`);
    client.destroy(); // Explicitly destroy the socket on timeout to free resources.
  });

  // Attempt to connect to the target server.
  client.connect(port, ip, () => {
    console.log(`[TCP Client - ${source}] 🔗 Successfully connected to ${ip}:${port}.`);
    // Once connected, send the message. 'ascii' encoding is used.
    // TODO: Message encoding ('ascii') could be made configurable if needed.
    client.write(message, 'ascii', () => {
      console.log(`[TCP Client - ${source}] 📤 Message sent to ${ip}:${port}: "${message}"`);
    });
  });

  // Event handler for receiving data from the server.
  client.on('data', (data) => {
    console.log(`[TCP Client - ${source}] 📥 Response received from ${ip}:${port}: "${data.toString().trim()}"`);
    // After receiving data, it's common to close the connection if no further interaction is expected.
    // client.end() sends a FIN packet and gracefully closes the socket after writing any remaining data.
    client.end(); 
  });

  // Event handler for when the connection is fully closed (after a FIN packet is sent and acknowledged).
  client.on('close', (hadError) => {
    if (hadError) {
      // This typically means the error event was already emitted.
      console.log(`[TCP Client - ${source}] 🔌 Connection to ${ip}:${port} closed due to a transmission error.`);
    } else {
      console.log(`[TCP Client - ${source}] 🔌 Connection to ${ip}:${port} closed successfully.`);
    }
  });

  // Event handler for connection errors (e.g., server not reachable, connection refused).
  client.on('error', (err) => {
    // err.code can provide specific error types like 'ECONNREFUSED', 'ETIMEDOUT' (though handled by client.setTimeout), 'EHOSTUNREACH'.
    console.error(`[TCP Client - ${source}] ❌ Connection error with ${ip}:${port}: ${err.message} (Code: ${err.code || 'N/A'})`);
    // No need to call client.destroy() here as it's often called automatically on error,
    // or the 'close' event will follow.
  });
}

module.exports = tcpClient;

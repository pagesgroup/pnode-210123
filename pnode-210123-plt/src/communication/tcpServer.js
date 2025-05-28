// This class defines a reusable TCP server
class tcpServer {

  /**
   * Constructor is called when you create a new server with: new TcpServer(...)
   * @param {string} name - Name of the server (used in logging)
   * @param {function} onMessage - Function that is called when a client sends a message
   * @param {object} options - Options such as IP address, port number, and what to do with incoming messages
   *    @param {string} options.ip - The IP address on which the server should listen
   *    @param {number} options.port - The TCP port on which to listen
   **/

  constructor(name, onMessage, { ip, port}) {
    this.name = name;                   // Logging name for this server
    this.ip = ip;                       // IP on which this server should listen
    this.port = port;                   // TCP port number
    this.onMessage = onMessage;         // Callback function to be invoked when a message is received from a client.

    // Create the actual TCP server instance using Node.js 'net' module.
    // The callback function provided to createServer is executed each time a new client connects.
    this.server = require('net').createServer((socket) => {
      // 'socket' is a net.Socket object, representing the connection to the client.
      const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`[TCP Server - ${this.name}] ✅ Client connected: ${clientAddress}`);

      // Event handler for when data is received from this client.
      socket.on('data', (data) => {
        // Convert the received Buffer to a UTF-8 string.
        const receivedMessage = data.toString('utf8');
        // Log received message, truncating if very long for console readability.
        console.log(`[TCP Server - ${this.name}] 📩 Received from ${clientAddress}: "${receivedMessage.slice(0, 150)}${receivedMessage.length > 150 ? '...' : ''}"`);

        // If a message handler callback was provided to the constructor, invoke it.
        // This allows custom processing of the incoming message.
        if (this.onMessage) {
          this.onMessage(receivedMessage, socket); // Pass the message and the socket for potential direct reply.
        }

        // Send a default acknowledgment message back to the client.
        // The '\0' (null character) might be used as an end-of-message delimiter by some systems.
        // TODO: Consider making this acknowledgment message configurable if needed.
        socket.write('Data received\0', 'ascii', () => {
          console.log(`[TCP Server - ${this.name}] 📤 Sent acknowledgment to ${clientAddress}.`);
        });
      });

      // Event handler for when the client signals the end of transmission (sends a FIN packet).
      // This means the client will not send any more data.
      socket.on('end', () => {
        console.log(`[TCP Server - ${this.name}] 🔌 Client ${clientAddress} disconnected (sent FIN).`);
      });

      // Event handler for when the socket is fully closed.
      // This can occur after 'end', due to an error, or explicit destruction.
      socket.on('close', (hadError) => {
        if (hadError) {
          console.log(`[TCP Server - ${this.name}] 🔒 Connection with ${clientAddress} closed due to an error.`);
        } else {
          console.log(`[TCP Server - ${this.name}] 🔒 Connection with ${clientAddress} closed gracefully.`);
        }
      });

      // Event handler for errors on this specific client socket.
      socket.on('error', (err) => {
        console.error(`[TCP Server - ${this.name}] ❌ Socket error with client ${clientAddress}: ${err.message} (Code: ${err.code || 'N/A'})`);
        // The socket might be automatically closed after an error, triggering the 'close' event.
      });
    });

    // Event handler for errors that occur on the server itself (e.g., if the server cannot bind to the port).
    this.server.on('error', (err) => {
      console.error(`[TCP Server - ${this.name}] ❌ Server error: ${err.message} (Code: ${err.code || 'N/A'})`);
      // Specific error codes like 'EADDRINUSE' (address already in use) can be checked here.
      if (err.code === 'EADDRINUSE') {
        console.error(`[TCP Server - ${this.name}] 🔥 Port ${this.port} on IP ${this.ip} is already in use. Ensure no other service is using this port.`);
      }
    });
  }

  /**
   * Starts the TCP server, making it listen for incoming connections on the configured IP address and port.
   */
  start() {
    if (!this.server) {
      console.error(`[TCP Server - ${this.name}] ❌ Server not initialized. Cannot start.`);
      return;
    }
    this.server.listen(this.port, this.ip, () => {
      console.log(`[TCP Server - ${this.name}] 🚀 Server listening on ${this.ip}:${this.port}`);
    });
  }
}

// Make the tcpServer class available for use in other modules.
module.exports = tcpServer;

const WebSocket = require('ws');
const express = require('express');

// Create Express app for webhook
const app = express();
app.use(express.json());

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  // Optional: Handle messages from ESP32
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });
});

// Webhook endpoint to set RGB values
app.post('/api/rgb', (req, res) => {
  const { r, g, b } = req.body;

  // Validate RGB values
  if (!isValidRGB(r) || !isValidRGB(g) || !isValidRGB(b)) {
    return res.status(400).json({ error: 'Invalid RGB values. Must be 0-255.' });
  }

  // Format message for ESP32
  const message = `RGB:${r},${g},${b}`;

  // Send to all connected clients
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  res.json({ success: true, message: `Sent ${message} to ${clients.size} clients` });
});

// Helper function to validate RGB values
function isValidRGB(value) {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  console.log(`WebSocket server running on port 8080`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
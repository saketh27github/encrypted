const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const data = require('./data.json');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const ENCRYPTION_KEY = "YOUR_ENCRYPTION_KEY_HERE"; // Must be 32 bytes (256 bits)
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('sendData', (data) => {
    const decryptedData = decrypt(data);
    // Here you can save to InfluxDB or any other Time Series DB
    // After saving, emit it to frontend (or any other logic you want)
    socket.emit('receivedData', decryptedData);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});





function generateRandomData() {
  const name = data.names[Math.floor(Math.random() * data.names.length)];
  const origin = data.origins[Math.floor(Math.random() * data.origins.length)];
  const destination = data.destinations[Math.floor(Math.random() * data.destinations.length)];

  const secret_key = crypto.createHash('sha256').update(name + origin + destination).digest('hex');

  return {
    name,
    origin,
    destination,
    secret_key
  };
}

function generateAndEmitData() {
  const numOfMessages = Math.floor(Math.random() * (500 - 49)) + 49; // Random number between 49 and 499

  for (let i = 0; i < numOfMessages; i++) {
    const message = generateRandomData();
    const encryptedMessage = encrypt(JSON.stringify(message));

    // Emit to any connected client (in real-world, you'd probably target specific clients)
    io.emit('sendData', encryptedMessage);
  }
}

// Generate and emit encrypted data periodically, e.g., every 10 seconds
setInterval(generateAndEmitData, 10000);




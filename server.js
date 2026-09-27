const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

let latestData = {
  temperature: 0,
  humidity: 0,
  signal: 0,
  status: 'WAITING'
};

app.get('/api/status', (req, res) => {
  res.json(latestData);
});

app.post('/api/data', (req, res) => {
  const { temperature, humidity, signal } = req.body;

  if (temperature === undefined || humidity === undefined || signal === undefined) {
    return res.status(400).json({ message: 'Missing temperature, humidity, or signal' });
  }

  latestData = {
    temperature: Number(temperature),
    humidity: Number(humidity),
    signal: Number(signal),
    status: Number(signal) < -80 ? 'WARNING' : 'OK'
  };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(latestData));
    }
  });

  res.json({ message: 'Data accepted', data: latestData });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify(latestData));
});

server.listen(PORT, () => {
  console.log(`ESP dashboard server running on http://localhost:${PORT}`);
});

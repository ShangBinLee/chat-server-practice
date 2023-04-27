import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import fetch from 'node-fetch';
import url from 'url';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const filePath = url.fileURLToPath(import.meta.url);
const dirPath = path.dirname(filePath);

app.get('/', (_, res) => {
  res.sendFile(path.join(dirPath, 'index.html'));
});

server.listen(3000, () => {
  console.log('listening on 3000');
})
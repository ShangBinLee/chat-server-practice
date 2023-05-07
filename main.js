import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import fetch from 'node-fetch';
import url from 'url';
import path from 'path';
import fsPromises from "node:fs/promises";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const filePath = url.fileURLToPath(import.meta.url);
const dirPath = path.dirname(filePath);

app.use(express.json());

app.get('/', (_, res) => {
  res.sendFile(path.join(dirPath, 'index.html'));
});

app.post('/login', async (req, res) => {
  const { id : inputId, pwd : inputPassword } = req.body;

  const accountsJSON = await fsPromises.readFile('user-accounts.json');

  const accounts = JSON.parse(accountsJSON)
    .filter(({ id, pwd }) => inputId === id && inputPassword === pwd);

  if(accounts.length === 0) {
    return res.status(401).json({ 
      status : 401,
      status_text : '401 Unauthorized',
      message : '아이디 비밀번호가 잘못되었습니다'
    });
  }

  const { username } = accounts[0];
  
  res.json({ username });
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on('connection', async (socket) => {
  const username = socket.username;

  const rooms = await fsPromises.readFile('chat-rooms.json');

  const userRooms = JSON.parse(rooms)
    .filter(({ seller_name, buyer_name }) => 
      seller_name === username || buyer_name === username);
  
  const userRoomIds = userRooms.map(({ id }) => id);

  socket.leave(socket.id);
  socket.join(userRoomIds);

  socket.emit('chat_rooms', userRooms);

  socket.on('logout', () => {
    socket.leave(userRoomIds);
    socket.disconnect(true);
  });

  socket.on('dm', (roomId, msg) => {
    io.to(roomId).emit('dm', { roomId, msg });
  });
});

server.listen(3000, () => {
  console.log('listening on 3000');
});
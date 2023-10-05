const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  // init: (server) => {
  if (io) {
    console.warn('Socket.IO is already initialized!');
    return io;
  }

  io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'ws://localhost:3000',
        'http://localhost:3000/',
        'http://localhost:3000/profile',
      ],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'access-control-allow-origin',
        'Access-Control-Allow-Headers',
        'card-name',
        'Authorization',
        'User-Agent',
        'text/plain',
        'application/json',
      ],
    },
  });

  return io;
  // },
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };

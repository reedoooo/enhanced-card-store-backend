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
        'https://main--tcg-database.netlify.app/',
        'ws://localhost:3000',
        'http://localhost:3000/',
        'http://localhost:3000/profile',
      ],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
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

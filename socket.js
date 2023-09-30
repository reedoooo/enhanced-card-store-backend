const socketIo = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    if (io) {
      console.warn('Attempting to initialize Socket.IO after it was already initialized!');
      return io;
    }

    io = socketIo(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3000/',
          'http://localhost:3000/profile',
        ],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: [
          'Content-Type',
          'access-control-allow-origin',
          'card-name',
          'Authorization',
          'User-Agent',
          'text/plain',
          'application/json',
        ],
      },
    });

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      // Set up your event listeners here, for example:
      // socket.on('my-event', (data) => {
      //   console.log('my-event received:', data);
      // });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error(
        'Socket.io not initialized. Ensure you call init before trying to use the IO instance.',
      );
    }
    return io;
  },
};

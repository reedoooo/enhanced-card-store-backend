const socketIo = require('socket.io');
const { updateChartData } = require('./routes/other/itemUpdates');
const { cronJob } = require('./routes/other/collection-cron');

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
      const dataToSend = {
        data: updateChartData,
        allCollectionData: cronJob,
      };
      // Set up your event listeners here, for example:
      // socket.on('my-event', (data) => {
      //   console.log('my-event received:', data);
      // });
      socket.emit('returnvalue', dataToSend.data);
      socket.emit('all-items-updated', dataToSend.allCollectionData);

      // socket.emit('returnvalue', { data: returnValue});

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

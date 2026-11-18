const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Automatically join default "general" room on connection
    const defaultRoom = 'general';
    socket.join(defaultRoom);
    console.log(`${socket.id} joined room ${defaultRoom}`);

    // Allow switching/joining custom rooms
    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    });

    // Broadcast chat messages to the room
    socket.on('chatMessage', ({ room = 'general', username = 'Anonymous', message }) => {
      console.log(`[${room}] ${username}: ${message}`);
      io.to(room).emit('message', {
        room,
        username,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;

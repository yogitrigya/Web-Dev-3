const jwt = require('jsonwebtoken');

const initSocket = (io) => {
  // JWT authentication middleware for Socket.IO connections
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // { id, role, section }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, section } = socket.user;
    console.log(`[SOCKET] Connected: ${id} (${role})`);

    // Join global university channel & personal channel
    socket.join('university');
    socket.join(`user:${id}`);

    if (section) {
      socket.join(`section:${section}`);
    }

    // Allow clients to subscribe to specific course channels
    socket.on('joinCourseRoom', (courseId) => {
      socket.join(`course:${courseId}`);
      console.log(`[SOCKET] User ${id} joined course:${courseId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Disconnected: ${id}`);
    });
  });
};

module.exports = initSocket;

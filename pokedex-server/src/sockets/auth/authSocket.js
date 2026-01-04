const jwt = require('jsonwebtoken');

function authSocket() {
  return (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('UNAUTHORIZED'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.sub, email: payload.email, name: payload.name };
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  };
}

module.exports = { authSocket };
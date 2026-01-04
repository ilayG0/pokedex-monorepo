const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT_SECRET is not defined');
    }
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };

    return next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT verification failed:', err.message);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { auth };

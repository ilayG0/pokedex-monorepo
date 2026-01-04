const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined. Set it in your .env file.');
}

function signToken(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    name: user.name, 
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function signup(req, res) {
  try {
    let { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ message: 'Email, password and username are required' });
    }

    email = String(email).trim().toLowerCase();
    username = String(username).trim();

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: 'Invalid email, username or password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'User with this email already exists' });
    }

    const user = new User({
      email,
      password,      
      name: username, 
    });

    await user.save();

    const token = signToken(user);

    return res.status(201).json({
      message: 'User created successfully',
      token,
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Signup error:', err);
    }

    if (err && err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'User with this email already exists' });
    }

    if (err && err.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Invalid user data', details: err.errors });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', err);
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub; 

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('GetMe error:', err);
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { signup, login, getMe };

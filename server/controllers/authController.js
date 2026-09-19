const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new citizen account
 * Route: POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const rawName = req.body.name;
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;
    const rawPhone = req.body.phone;

    const name = typeof rawName === 'string' ? rawName.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const password = typeof rawPassword === 'string' ? rawPassword : '';
    const phone = typeof rawPhone === 'string' ? rawPhone.trim() : null;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        message: 'Name must be between 2 and 100 characters',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    if (phone && phone.length > 20) {
      return res.status(400).json({
        message: 'Phone number must not exceed 20 characters',
      });
    }

    // Check if email already registered
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'user']
    );

    const userId = result.insertId;

    // Initialize user profile record
    await db.query(
      'INSERT INTO user_profiles (user_id) VALUES (?)',
      [userId]
    );

    return res.status(201).json({
      message: 'Registration successful',
      userId,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      message: 'Registration failed. Please try again.',
    });
  }
};

/**
 * Login user and issue JWT
 * Route: POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const password = typeof rawPassword === 'string' ? rawPassword : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const [users] = await db.query(
      'SELECT id, name, email, password, phone, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({
        message: 'Authentication service configuration error.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      message: 'Login failed. Please try again.',
    });
  }
};

module.exports = {
  register,
  login,
};

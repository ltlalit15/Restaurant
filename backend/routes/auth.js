const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const users = [
  { id: '1', email: 'admin@example.com', password: process.env.DEMO_PASSWORD || '123', role: 'Admin', name: 'Admin User' },
  { id: '2', email: 'staff@example.com', password: process.env.DEMO_PASSWORD || '123', role: 'Staff', name: 'Staff User' },
  { id: '3', email: 'user@example.com', password: process.env.DEMO_PASSWORD || '123', role: 'User', name: 'Regular User' },
  { id: '4', email: 'demo@restaurant.com', password: process.env.DEMO_ADMIN_PASSWORD || 'demo123', role: 'Admin', name: 'Demo Admin' },
  { id: '5', email: 'kitchen@restaurant.com', password: process.env.DEMO_STAFF_PASSWORD || 'kitchen123', role: 'Staff', name: 'Kitchen Staff' },
  { id: '6', email: 'manager@restaurant.com', password: process.env.DEMO_ADMIN_PASSWORD || 'manager123', role: 'Admin', name: 'Manager' },
  { id: '7', email: 'waiter@restaurant.com', password: process.env.DEMO_STAFF_PASSWORD || 'waiter123', role: 'Staff', name: 'Waiter' },
  { id: '8', email: 'customer@restaurant.com', password: process.env.DEMO_USER_PASSWORD || 'customer123', role: 'User', name: 'Customer' }
];

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = users.find(
      u => u.email === email && u.password === password && u.role === role
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Login failed: ${error.message}`
    });
  }
});

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No valid token provided'
    });
  }

  const token = authHeader.substring(7);
  const userId = token.split('-')[3];
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }
  });
});

module.exports = router;

const User = require('../models/User');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;

    const result = await User.getAll(page, limit, role);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, discount_percentage } = req.body;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const userId = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user',
      discount_percentage: discount_percentage || 0
    });

    // Get created user
    const user = await User.findById(userId);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status, discount_percentage } = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await User.emailExists(email, id);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user
    const updated = await User.update(id, {
      name,
      email,
      phone,
      role,
      status,
      discount_percentage
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    // Get updated user
    const user = await User.findById(id);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin users
    if (existingUser.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Soft delete user
    const deleted = await User.delete(id);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await User.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
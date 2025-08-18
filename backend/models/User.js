const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    const { name, email, password, phone, role = 'user', discount_percentage = 0 } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password, phone, role, discount_percentage) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone, role, discount_percentage]
    );
    
    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND status = "active"',
      [email]
    );
    return users[0];
  }

  // Find user by ID
  static async findById(id) {
    const [users] = await db.execute(
      'SELECT id, name, email, phone, role, status, discount_percentage, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0];
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 10, role = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, name, email, phone, role, status, discount_percentage, created_at FROM users';
    let params = [];
    
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [users] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    let countParams = [];
    
    if (role) {
      countQuery += ' WHERE role = ?';
      countParams.push(role);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    return {
      users,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Update user
  static async update(id, userData) {
    const { name, email, phone, role, status, discount_percentage } = userData;
    
    const [result] = await db.execute(
      `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ?, discount_percentage = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, email, phone, role, status, discount_percentage, id]
    );
    
    return result.affectedRows > 0;
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await db.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
    
    return result.affectedRows > 0;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Delete user (soft delete)
  static async delete(id) {
    const [result] = await db.execute(
      'UPDATE users SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM users WHERE email = ?';
    let params = [email];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [users] = await db.execute(query, params);
    return users.length > 0;
  }

  // Get user statistics
  static async getStats() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users
      FROM users
    `);
    
    return stats[0];
  }
}

module.exports = User;
const db = require('../config/database');

class Table {
  // Create new table
  static async create(tableData) {
    const { 
      table_number, 
      table_name, 
      table_type, 
      group_id, 
      capacity = 4, 
      hourly_rate, 
      location, 
      plug_id 
    } = tableData;
    
    const [result] = await db.execute(
      `INSERT INTO tables (table_number, table_name, table_type, group_id, capacity, hourly_rate, location, plug_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [table_number, table_name, table_type, group_id, capacity, hourly_rate, location, plug_id]
    );
    
    return result.insertId;
  }

  // Get all tables with group information
  static async getAll(type = null, status = null) {
    let query = `
      SELECT t.*, tg.name as group_name, tg.description as group_description,
             sp.plug_id, sp.status as plug_status, sp.power_state
      FROM tables t
      LEFT JOIN table_groups tg ON t.group_id = tg.id
      LEFT JOIN smart_plugs sp ON t.plug_id = sp.plug_id
    `;
    
    let params = [];
    let conditions = [];
    
    if (type) {
      conditions.push('t.table_type = ?');
      params.push(type);
    }
    
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.table_number';
    
    const [tables] = await db.execute(query, params);
    return tables;
  }

  // Get table by ID
  static async findById(id) {
    const [tables] = await db.execute(
      `SELECT t.*, tg.name as group_name, tg.description as group_description,
              sp.plug_id, sp.status as plug_status, sp.power_state
       FROM tables t
       LEFT JOIN table_groups tg ON t.group_id = tg.id
       LEFT JOIN smart_plugs sp ON t.plug_id = sp.plug_id
       WHERE t.id = ?`,
      [id]
    );
    return tables[0];
  }

  // Get table by number
  static async findByNumber(table_number) {
    const [tables] = await db.execute(
      'SELECT * FROM tables WHERE table_number = ?',
      [table_number]
    );
    return tables[0];
  }

  // Update table
  static async update(id, tableData) {
    const { 
      table_number, 
      table_name, 
      table_type, 
      group_id, 
      capacity, 
      hourly_rate, 
      status, 
      location, 
      plug_id 
    } = tableData;
    
    const [result] = await db.execute(
      `UPDATE tables SET 
       table_number = ?, table_name = ?, table_type = ?, group_id = ?, 
       capacity = ?, hourly_rate = ?, status = ?, location = ?, plug_id = ?,
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [table_number, table_name, table_type, group_id, capacity, hourly_rate, status, location, plug_id, id]
    );
    
    return result.affectedRows > 0;
  }

  // Update table status
  static async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE tables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    return result.affectedRows > 0;
  }

  // Delete table
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM tables WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Check if table number exists
  static async numberExists(table_number, excludeId = null) {
    let query = 'SELECT id FROM tables WHERE table_number = ?';
    let params = [table_number];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [tables] = await db.execute(query, params);
    return tables.length > 0;
  }

  // Get available tables by type and time
  static async getAvailable(table_type = null, date = null, time = null) {
    let query = `
      SELECT t.*, tg.name as group_name
      FROM tables t
      LEFT JOIN table_groups tg ON t.group_id = tg.id
      WHERE t.status = 'available'
    `;
    
    let params = [];
    
    if (table_type) {
      query += ' AND t.table_type = ?';
      params.push(table_type);
    }
    
    // Check for existing reservations if date and time provided
    if (date && time) {
      query += ` AND t.id NOT IN (
        SELECT table_id FROM reservations 
        WHERE reservation_date = ? 
        AND reservation_time = ? 
        AND status IN ('confirmed', 'arrived')
      )`;
      params.push(date, time);
    }
    
    query += ' ORDER BY t.table_number';
    
    const [tables] = await db.execute(query, params);
    return tables;
  }

  // Get table statistics
  static async getStats() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_tables,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_tables,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_tables,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_tables,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_tables,
        SUM(CASE WHEN table_type = 'restaurant' THEN 1 ELSE 0 END) as restaurant_tables,
        SUM(CASE WHEN table_type = 'pool' THEN 1 ELSE 0 END) as pool_tables,
        SUM(CASE WHEN table_type = 'snooker' THEN 1 ELSE 0 END) as snooker_tables,
        SUM(CASE WHEN table_type = 'playstation' THEN 1 ELSE 0 END) as playstation_tables
      FROM tables
    `);
    
    return stats[0];
  }

  // Get current session for table
  static async getCurrentSession(tableId) {
    const [sessions] = await db.execute(
      'SELECT * FROM sessions WHERE table_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [tableId]
    );
    return sessions[0];
  }
}

module.exports = Table;
const Table = require('../models/Table');
const db = require('../config/database');

// Get all tables
const getAllTables = async (req, res) => {
  try {
    const { type, status } = req.query;
    const tables = await Table.getAll(type, status);

    res.json({
      success: true,
      data: { tables }
    });
  } catch (error) {
    console.error('Get all tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tables',
      error: error.message
    });
  }
};

// Get available tables
const getAvailableTables = async (req, res) => {
  try {
    const { type, date, time } = req.query;
    const tables = await Table.getAvailable(type, date, time);

    res.json({
      success: true,
      data: { tables }
    });
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available tables',
      error: error.message
    });
  }
};

// Get table by ID
const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findById(id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Get current session if any
    const currentSession = await Table.getCurrentSession(id);

    res.json({
      success: true,
      data: { 
        table,
        currentSession
      }
    });
  } catch (error) {
    console.error('Get table by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table',
      error: error.message
    });
  }
};

// Create new table
const createTable = async (req, res) => {
  try {
    const tableData = req.body;

    // Check if table number already exists
    const existingTable = await Table.findByNumber(tableData.table_number);
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }

    // Create table
    const tableId = await Table.create(tableData);

    // Get created table
    const table = await Table.findById(tableId);

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: { table }
    });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating table',
      error: error.message
    });
  }
};

// Update table
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const tableData = req.body;

    // Check if table exists
    const existingTable = await Table.findById(id);
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table number is already taken by another table
    if (tableData.table_number !== existingTable.table_number) {
      const numberExists = await Table.numberExists(tableData.table_number, id);
      if (numberExists) {
        return res.status(400).json({
          success: false,
          message: 'Table number already exists'
        });
      }
    }

    // Update table
    const updated = await Table.update(id, tableData);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update table'
      });
    }

    // Get updated table
    const table = await Table.findById(id);

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: { table }
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating table',
      error: error.message
    });
  }
};

// Update table status
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'occupied', 'reserved', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if table exists
    const existingTable = await Table.findById(id);
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Update status
    const updated = await Table.updateStatus(id, status);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update table status'
      });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('table_status_updated', { tableId: id, status });

    res.json({
      success: true,
      message: 'Table status updated successfully',
      data: { tableId: id, status }
    });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating table status',
      error: error.message
    });
  }
};

// Delete table
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if table exists
    const existingTable = await Table.findById(id);
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table has active sessions
    const currentSession = await Table.getCurrentSession(id);
    if (currentSession) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete table with active session'
      });
    }

    // Delete table
    const deleted = await Table.delete(id);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete table'
      });
    }

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting table',
      error: error.message
    });
  }
};

// Get table statistics
const getTableStats = async (req, res) => {
  try {
    const stats = await Table.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get table stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table statistics',
      error: error.message
    });
  }
};

// Get table groups
const getTableGroups = async (req, res) => {
  try {
    const [groups] = await db.execute('SELECT * FROM table_groups ORDER BY name');

    res.json({
      success: true,
      data: { groups }
    });
  } catch (error) {
    console.error('Get table groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table groups',
      error: error.message
    });
  }
};

// Create table group
const createTableGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    const [result] = await db.execute(
      'INSERT INTO table_groups (name, description) VALUES (?, ?)',
      [name, description]
    );

    const [group] = await db.execute(
      'SELECT * FROM table_groups WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Table group created successfully',
      data: { group: group[0] }
    });
  } catch (error) {
    console.error('Create table group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating table group',
      error: error.message
    });
  }
};

module.exports = {
  getAllTables,
  getAvailableTables,
  getTableById,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getTableStats,
  getTableGroups,
  createTableGroup
};
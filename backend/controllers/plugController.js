const db = require('../config/database');
// const axios = require('axios'); // Uncomment when you have actual smart plug API endpoints

// Get all smart plugs
const getAllPlugs = async (req, res) => {
  try {
    const [plugs] = await db.execute(`
      SELECT sp.*, t.table_number, t.table_name, t.table_type
      FROM smart_plugs sp
      LEFT JOIN tables t ON sp.table_id = t.id
      ORDER BY sp.name
    `);

    res.json({
      success: true,
      data: { plugs }
    });
  } catch (error) {
    console.error('Get all plugs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching smart plugs',
      error: error.message
    });
  }
};

// Get plug by ID
const getPlugById = async (req, res) => {
  try {
    const { id } = req.params;
    const [plugs] = await db.execute(`
      SELECT sp.*, t.table_number, t.table_name, t.table_type
      FROM smart_plugs sp
      LEFT JOIN tables t ON sp.table_id = t.id
      WHERE sp.id = ?
    `, [id]);

    if (plugs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    res.json({
      success: true,
      data: { plug: plugs[0] }
    });
  } catch (error) {
    console.error('Get plug by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching smart plug',
      error: error.message
    });
  }
};

// Create new smart plug
const createPlug = async (req, res) => {
  try {
    const { plug_id, name, table_id, ip_address, mac_address } = req.body;

    // Check if plug_id already exists
    const [existing] = await db.execute(
      'SELECT id FROM smart_plugs WHERE plug_id = ?',
      [plug_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Plug ID already exists'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO smart_plugs (plug_id, name, table_id, ip_address, mac_address) VALUES (?, ?, ?, ?, ?)',
      [plug_id, name, table_id, ip_address, mac_address]
    );

    const [plug] = await db.execute(`
      SELECT sp.*, t.table_number, t.table_name, t.table_type
      FROM smart_plugs sp
      LEFT JOIN tables t ON sp.table_id = t.id
      WHERE sp.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Smart plug created successfully',
      data: { plug: plug[0] }
    });
  } catch (error) {
    console.error('Create plug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating smart plug',
      error: error.message
    });
  }
};

// Update smart plug
const updatePlug = async (req, res) => {
  try {
    const { id } = req.params;
    const { plug_id, name, table_id, ip_address, mac_address, status, power_state } = req.body;

    // Check if plug exists
    const [existing] = await db.execute(
      'SELECT * FROM smart_plugs WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    // Check if plug_id is already taken by another plug
    if (plug_id !== existing[0].plug_id) {
      const [duplicate] = await db.execute(
        'SELECT id FROM smart_plugs WHERE plug_id = ? AND id != ?',
        [plug_id, id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Plug ID already exists'
        });
      }
    }

    const [result] = await db.execute(
      `UPDATE smart_plugs SET plug_id = ?, name = ?, table_id = ?, ip_address = ?, 
       mac_address = ?, status = ?, power_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [plug_id, name, table_id, ip_address, mac_address, status, power_state, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update smart plug'
      });
    }

    const [plug] = await db.execute(`
      SELECT sp.*, t.table_number, t.table_name, t.table_type
      FROM smart_plugs sp
      LEFT JOIN tables t ON sp.table_id = t.id
      WHERE sp.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Smart plug updated successfully',
      data: { plug: plug[0] }
    });
  } catch (error) {
    console.error('Update plug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating smart plug',
      error: error.message
    });
  }
};

// Control plug power (turn on/off)
const controlPlugPower = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'on' or 'off'

    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "on" or "off"'
      });
    }

    const [plugs] = await db.execute(
      'SELECT * FROM smart_plugs WHERE id = ?',
      [id]
    );

    if (plugs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    const plug = plugs[0];

    // Simulate smart plug control (replace with actual smart plug API)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update plug status in database
      await db.execute(
        'UPDATE smart_plugs SET power_state = ?, status = "online", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [action, id]
      );

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      io.emit('plug_power_changed', { 
        plugId: id, 
        plug_id: plug.plug_id,
        power_state: action,
        table_id: plug.table_id
      });

      res.json({
        success: true,
        message: `Smart plug turned ${action} successfully (simulated)`,
        data: { 
          plug_id: plug.plug_id,
          power_state: action,
          simulation: true
        }
      });
    } catch (error) {
      // Update plug status to offline if API call fails
      await db.execute(
        'UPDATE smart_plugs SET status = "offline", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      res.status(400).json({
        success: false,
        message: 'Failed to control smart plug',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Control plug power error:', error);
    res.status(500).json({
      success: false,
      message: 'Error controlling smart plug',
      error: error.message
    });
  }
};

// Get plug status
const getPlugStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [plugs] = await db.execute(
      'SELECT * FROM smart_plugs WHERE id = ?',
      [id]
    );

    if (plugs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    const plug = plugs[0];

    // Simulate real-time status (replace with actual smart plug API)
    try {
      // Simulate random power consumption based on power state
      const simulatedConsumption = plug.power_state === 'on' ? 
        Math.floor(Math.random() * 200) + 50 : 0;
      
      // Update database with simulated data
      await db.execute(
        `UPDATE smart_plugs SET power_consumption = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [simulatedConsumption, id]
      );

      res.json({
        success: true,
        data: {
          plug_id: plug.plug_id,
          name: plug.name,
          status: plug.status,
          power_state: plug.power_state,
          power_consumption: simulatedConsumption,
          last_updated: new Date().toISOString(),
          simulation: true
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          plug_id: plug.plug_id,
          name: plug.name,
          status: plug.status,
          power_state: plug.power_state,
          power_consumption: plug.power_consumption,
          last_updated: plug.updated_at,
          note: 'Cached status from database'
        }
      });
    }
  } catch (error) {
    console.error('Get plug status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plug status',
      error: error.message
    });
  }
};

// Update plug status
const updatePlugStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['online', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const [result] = await db.execute(
      'UPDATE smart_plugs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    res.json({
      success: true,
      message: 'Smart plug status updated successfully',
      data: { plug_id: id, status }
    });
  } catch (error) {
    console.error('Update plug status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plug status',
      error: error.message
    });
  }
};

// Get power consumption
const getPowerConsumption = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.query; // 'hour', 'day', 'week', 'month'

    const [plugs] = await db.execute(
      'SELECT * FROM smart_plugs WHERE id = ?',
      [id]
    );

    if (plugs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    const plug = plugs[0];

    // Simulate power consumption data (replace with actual smart plug API)
    const generateConsumptionData = (period) => {
      const data = [];
      const points = period === 'hour' ? 60 : period === 'day' ? 24 : period === 'week' ? 7 : 30;
      
      for (let i = 0; i < points; i++) {
        data.push({
          timestamp: new Date(Date.now() - (points - i) * (period === 'hour' ? 60000 : period === 'day' ? 3600000 : 86400000)),
          consumption: plug.power_state === 'on' ? Math.floor(Math.random() * 50) + 100 : 0
        });
      }
      return data;
    };

    res.json({
      success: true,
      data: {
        plug_id: plug.plug_id,
        name: plug.name,
        period: period || 'day',
        consumption_data: generateConsumptionData(period || 'day'),
        simulation: true
      }
    });
  } catch (error) {
    console.error('Get power consumption error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching power consumption',
      error: error.message
    });
  }
};

// Bulk control plugs
const bulkControlPlugs = async (req, res) => {
  try {
    const { plug_ids, action } = req.body;

    if (!Array.isArray(plug_ids) || plug_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'plug_ids must be a non-empty array'
      });
    }

    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "on" or "off"'
      });
    }

    const results = [];

    for (const plugId of plug_ids) {
      try {
        const [plugs] = await db.execute(
          'SELECT * FROM smart_plugs WHERE id = ?',
          [plugId]
        );

        if (plugs.length === 0) {
          results.push({
            plug_id: plugId,
            success: false,
            message: 'Smart plug not found'
          });
          continue;
        }

        const plug = plugs[0];

        // Simulate smart plug API call
        await new Promise(resolve => setTimeout(resolve, 200));

        // Update plug status in database
        await db.execute(
          'UPDATE smart_plugs SET power_state = ?, status = "online", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [action, plugId]
        );

        results.push({
          plug_id: plugId,
          success: true,
          message: `Smart plug turned ${action} successfully (simulated)`,
          simulation: true
        });
      } catch (error) {
        results.push({
          plug_id: plugId,
          success: false,
          message: 'Failed to control smart plug',
          error: error.message
        });
      }
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('bulk_plug_control', { action, results });

    res.json({
      success: true,
      message: 'Bulk control operation completed',
      data: { results }
    });
  } catch (error) {
    console.error('Bulk control plugs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error controlling smart plugs',
      error: error.message
    });
  }
};

// Delete smart plug
const deletePlug = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM smart_plugs WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Smart plug not found'
      });
    }

    res.json({
      success: true,
      message: 'Smart plug deleted successfully'
    });
  } catch (error) {
    console.error('Delete plug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting smart plug',
      error: error.message
    });
  }
};

module.exports = {
  getAllPlugs,
  getPlugById,
  createPlug,
  updatePlug,
  controlPlugPower,
  getPlugStatus,
  updatePlugStatus,
  getPowerConsumption,
  bulkControlPlugs,
  deletePlug
};
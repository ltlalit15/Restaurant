const db = require('../config/database');
const moment = require('moment');

// Generate session ID
const generateSessionId = () => {
  return `SES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Calculate session cost
const calculateSessionCost = (startTime, endTime, hourlyRate) => {
  const start = moment(startTime);
  const end = moment(endTime);
  const durationMinutes = end.diff(start, 'minutes');
  const durationHours = durationMinutes / 60;
  return Math.round(durationHours * hourlyRate * 100) / 100; // Round to 2 decimal places
};

// Get all sessions
const getAllSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { status, table_id, date } = req.query;
    
    let query = `
      SELECT s.*, t.table_number, t.table_name, t.table_type, u.name as user_name
      FROM sessions s
      JOIN tables t ON s.table_id = t.id
      LEFT JOIN users u ON s.user_id = u.id
    `;
    
    let params = [];
    let conditions = [];
    
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    
    if (table_id) {
      conditions.push('s.table_id = ?');
      params.push(table_id);
    }
    
    if (date) {
      conditions.push('DATE(s.start_time) = ?');
      params.push(date);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY s.start_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [sessions] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM sessions s JOIN tables t ON s.table_id = t.id';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }
    
    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        sessions,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message
    });
  }
};

// Get user's sessions
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [sessions] = await db.execute(
      `SELECT s.*, t.table_number, t.table_name, t.table_type
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.user_id = ?
       ORDER BY s.start_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user sessions',
      error: error.message
    });
  }
};

// Get active sessions
const getActiveSessions = async (req, res) => {
  try {
    const [sessions] = await db.execute(
      `SELECT s.*, t.table_number, t.table_name, t.table_type, u.name as user_name,
              TIMESTAMPDIFF(MINUTE, s.start_time, NOW()) as elapsed_minutes
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = 'active'
       ORDER BY s.start_time ASC`
    );

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active sessions',
      error: error.message
    });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [sessions] = await db.execute(
      `SELECT s.*, t.table_number, t.table_name, t.table_type, t.hourly_rate, u.name as user_name,
              TIMESTAMPDIFF(MINUTE, s.start_time, COALESCE(s.end_time, NOW())) as duration_minutes
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user can access this session
    if (req.user.role === 'user' && session.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get orders for this session
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC',
      [id]
    );

    session.orders = orders;

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session',
      error: error.message
    });
  }
};

// Start new session
const startSession = async (req, res) => {
  try {
    const { table_id, customer_name, customer_phone } = req.body;

    // Check if table exists and is available
    const [tables] = await db.execute(
      'SELECT * FROM tables WHERE id = ? AND status = "available"',
      [table_id]
    );

    if (tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table not found or not available'
      });
    }

    const table = tables[0];

    // Check if there's already an active session for this table
    const [activeSessions] = await db.execute(
      'SELECT * FROM sessions WHERE table_id = ? AND status = "active"',
      [table_id]
    );

    if (activeSessions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Table already has an active session'
      });
    }

    // Generate session ID
    const session_id = generateSessionId();

    // Create session
    const [result] = await db.execute(
      `INSERT INTO sessions (session_id, table_id, user_id, customer_name, customer_phone, hourly_rate) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session_id, table_id, req.user?.id, customer_name, customer_phone, table.hourly_rate]
    );

    // Update table status to occupied
    await db.execute(
      'UPDATE tables SET status = "occupied" WHERE id = ?',
      [table_id]
    );

    // Turn on smart plug if connected
    if (table.plug_id) {
      try {
        // Call plug API to turn on
        const io = req.app.get('io');
        io.emit('plug_auto_control', { 
          plug_id: table.plug_id,
          action: 'on',
          reason: 'session_started'
        });
      } catch (plugError) {
        console.error('Failed to turn on plug:', plugError);
      }
    }

    // Get created session
    const [session] = await db.execute(
      `SELECT s.*, t.table_number, t.table_name, t.table_type
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('session_started', session[0]);
    io.to(`table_${table_id}`).emit('session_started', session[0]);

    res.status(201).json({
      success: true,
      message: 'Session started successfully',
      data: { session: session[0] }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting session',
      error: error.message
    });
  }
};

// End session
const endSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Get session details
    const [sessions] = await db.execute(
      `SELECT s.*, t.table_number, t.table_name, t.plug_id
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.id = ? AND s.status = 'active'`,
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found'
      });
    }

    const session = sessions[0];
    const endTime = new Date();
    const durationMinutes = Math.ceil((endTime - new Date(session.start_time)) / (1000 * 60));
    const sessionCost = calculateSessionCost(session.start_time, endTime, session.hourly_rate);

    // Update session
    const [result] = await db.execute(
      `UPDATE sessions SET end_time = ?, duration_minutes = ?, session_cost = ?, 
       status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [endTime, durationMinutes, sessionCost, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to end session'
      });
    }

    // Update table status to available
    await db.execute(
      'UPDATE tables SET status = "available" WHERE id = ?',
      [session.table_id]
    );

    // Turn off smart plug if connected
    if (session.plug_id) {
      try {
        const io = req.app.get('io');
        io.emit('plug_auto_control', { 
          plug_id: session.plug_id,
          action: 'off',
          reason: 'session_ended'
        });
      } catch (plugError) {
        console.error('Failed to turn off plug:', plugError);
      }
    }

    // Get updated session
    const [updatedSession] = await db.execute(
      `SELECT s.*, t.table_number, t.table_name, t.table_type
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.id = ?`,
      [id]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('session_ended', updatedSession[0]);
    io.to(`table_${session.table_id}`).emit('session_ended', updatedSession[0]);

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: { 
        session: updatedSession[0],
        duration_minutes: durationMinutes,
        session_cost: sessionCost
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending session',
      error: error.message
    });
  }
};

// Pause session
const pauseSession = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'UPDATE sessions SET status = "paused", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "active"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found'
      });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('session_paused', { sessionId: id });

    res.json({
      success: true,
      message: 'Session paused successfully'
    });
  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing session',
      error: error.message
    });
  }
};

// Resume session
const resumeSession = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'UPDATE sessions SET status = "active", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "paused"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paused session not found'
      });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('session_resumed', { sessionId: id });

    res.json({
      success: true,
      message: 'Session resumed successfully'
    });
  } catch (error) {
    console.error('Resume session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming session',
      error: error.message
    });
  }
};

// Extend session
const extendSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { extend_minutes } = req.body;

    if (!extend_minutes || extend_minutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid extend_minutes value'
      });
    }

    // Get session details
    const [sessions] = await db.execute(
      'SELECT * FROM sessions WHERE id = ? AND status IN ("active", "paused")',
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already completed'
      });
    }

    const session = sessions[0];

    // Calculate new end time (if there was a planned end time)
    // For now, we'll just log the extension
    const [result] = await db.execute(
      'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('session_extended', { 
      sessionId: id, 
      extendMinutes: extend_minutes,
      tableId: session.table_id
    });

    res.json({
      success: true,
      message: `Session extended by ${extend_minutes} minutes`,
      data: { 
        sessionId: id,
        extendMinutes: extend_minutes
      }
    });
  } catch (error) {
    console.error('Extend session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending session',
      error: error.message
    });
  }
};

// Get session statistics
const getSessionStats = async (req, res) => {
  try {
    const date = req.query.date || moment().format('YYYY-MM-DD');
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_sessions,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_sessions,
        AVG(duration_minutes) as average_duration_minutes,
        SUM(session_cost) as total_revenue,
        AVG(session_cost) as average_session_cost
      FROM sessions
      WHERE DATE(start_time) = ?
    `, [date]);

    res.json({
      success: true,
      data: { 
        stats: stats[0],
        date
      }
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllSessions,
  getUserSessions,
  getActiveSessions,
  getSessionById,
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  extendSession,
  getSessionStats
};
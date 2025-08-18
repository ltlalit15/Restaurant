const db = require('../config/database');
const moment = require('moment');

// Generate reservation ID
const generateReservationId = () => {
  return `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Get all reservations
const getAllReservations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { status, date, table_type } = req.query;
    
    let query = `
      SELECT r.*, t.table_number, t.table_name, t.table_type, u.name as user_name
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      LEFT JOIN users u ON r.user_id = u.id
    `;
    
    let params = [];
    let conditions = [];
    
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    
    if (date) {
      conditions.push('r.reservation_date = ?');
      params.push(date);
    }
    
    if (table_type) {
      conditions.push('t.table_type = ?');
      params.push(table_type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [reservations] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM reservations r JOIN tables t ON r.table_id = t.id';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }
    
    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        reservations,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
};

// Get user's reservations
const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [reservations] = await db.execute(
      `SELECT r.*, t.table_number, t.table_name, t.table_type
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE r.user_id = ?
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { reservations }
    });
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reservations',
      error: error.message
    });
  }
};

// Get reservation by ID
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [reservations] = await db.execute(
      `SELECT r.*, t.table_number, t.table_name, t.table_type, u.name as user_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = reservations[0];

    // Check if user can access this reservation
    if (req.user.role === 'user' && reservation.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { reservation }
    });
  } catch (error) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservation',
      error: error.message
    });
  }
};

// Create new reservation
const createReservation = async (req, res) => {
  try {
    const {
      table_id,
      customer_name,
      customer_phone,
      customer_email,
      reservation_date,
      reservation_time,
      duration_hours,
      party_size,
      special_requests
    } = req.body;

    // Check if table exists and is available
    const [tables] = await db.execute(
      'SELECT * FROM tables WHERE id = ? AND status IN ("available", "reserved")',
      [table_id]
    );

    if (tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table not found or not available'
      });
    }

    // Check for conflicting reservations
    const [conflicts] = await db.execute(
      `SELECT * FROM reservations 
       WHERE table_id = ? AND reservation_date = ? AND reservation_time = ? 
       AND status IN ('confirmed', 'arrived')`,
      [table_id, reservation_date, reservation_time]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Table is already reserved for this time slot'
      });
    }

    // Generate reservation ID
    const reservation_id = generateReservationId();

    // Create reservation
    const [result] = await db.execute(
      `INSERT INTO reservations (reservation_id, table_id, user_id, customer_name, customer_phone, 
       customer_email, reservation_date, reservation_time, duration_hours, party_size, special_requests) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reservation_id, table_id, req.user?.id, customer_name, customer_phone, customer_email,
       reservation_date, reservation_time, duration_hours || 2, party_size || 1, special_requests]
    );

    // Update table status to reserved
    await db.execute(
      'UPDATE tables SET status = "reserved" WHERE id = ?',
      [table_id]
    );

    // Get created reservation
    const [reservation] = await db.execute(
      `SELECT r.*, t.table_number, t.table_name, t.table_type
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('new_reservation', reservation[0]);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: { reservation: reservation[0] }
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reservation',
      error: error.message
    });
  }
};

// Update reservation
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      table_id,
      customer_name,
      customer_phone,
      customer_email,
      reservation_date,
      reservation_time,
      duration_hours,
      party_size,
      special_requests
    } = req.body;

    // Check if reservation exists
    const [existing] = await db.execute(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = existing[0];

    // Check if user can update this reservation
    if (req.user.role === 'user' && reservation.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if reservation can be updated (not arrived or completed)
    if (['arrived', 'no_show'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update reservation in current status'
      });
    }

    // If table is being changed, check availability
    if (table_id && table_id !== reservation.table_id) {
      const [conflicts] = await db.execute(
        `SELECT * FROM reservations 
         WHERE table_id = ? AND reservation_date = ? AND reservation_time = ? 
         AND status IN ('confirmed', 'arrived') AND id != ?`,
        [table_id, reservation_date, reservation_time, id]
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Table is already reserved for this time slot'
        });
      }
    }

    // Update reservation
    const [result] = await db.execute(
      `UPDATE reservations SET table_id = ?, customer_name = ?, customer_phone = ?, 
       customer_email = ?, reservation_date = ?, reservation_time = ?, duration_hours = ?, 
       party_size = ?, special_requests = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [table_id, customer_name, customer_phone, customer_email, reservation_date, 
       reservation_time, duration_hours, party_size, special_requests, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update reservation'
      });
    }

    // Get updated reservation
    const [updated] = await db.execute(
      `SELECT r.*, t.table_number, t.table_name, t.table_type
       FROM reservations r
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: { reservation: updated[0] }
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reservation',
      error: error.message
    });
  }
};

// Update reservation status
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'arrived', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get reservation details
    const [reservations] = await db.execute(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = reservations[0];

    // Update reservation status
    const [result] = await db.execute(
      'UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update reservation status'
      });
    }

    // Update table status based on reservation status
    let tableStatus = 'available';
    if (status === 'confirmed') {
      tableStatus = 'reserved';
    } else if (status === 'arrived') {
      tableStatus = 'occupied';
    }

    await db.execute(
      'UPDATE tables SET status = ? WHERE id = ?',
      [tableStatus, reservation.table_id]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('reservation_status_updated', { 
      reservationId: id, 
      status,
      tableId: reservation.table_id,
      tableStatus
    });

    res.json({
      success: true,
      message: 'Reservation status updated successfully',
      data: { reservationId: id, status }
    });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reservation status',
      error: error.message
    });
  }
};

// Cancel reservation
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reservation details
    const [reservations] = await db.execute(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = reservations[0];

    // Check if user can cancel this reservation
    if (req.user.role === 'user' && reservation.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if reservation can be cancelled
    if (['arrived', 'no_show'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel reservation in current status'
      });
    }

    // Update reservation status to cancelled
    await db.execute(
      'UPDATE reservations SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Update table status to available
    await db.execute(
      'UPDATE tables SET status = "available" WHERE id = ?',
      [reservation.table_id]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('reservation_cancelled', { 
      reservationId: id,
      tableId: reservation.table_id
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
};

// Delete reservation
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get reservation details
    const [reservations] = await db.execute(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = reservations[0];

    // Delete reservation
    const [result] = await db.execute(
      'DELETE FROM reservations WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete reservation'
      });
    }

    // Update table status to available if it was reserved
    if (reservation.status === 'confirmed') {
      await db.execute(
        'UPDATE tables SET status = "available" WHERE id = ?',
        [reservation.table_id]
      );
    }

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reservation',
      error: error.message
    });
  }
};

// Get reservation statistics
const getReservationStats = async (req, res) => {
  try {
    const date = req.query.date || moment().format('YYYY-MM-DD');
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_reservations,
        SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as arrived_reservations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_reservations,
        AVG(party_size) as average_party_size
      FROM reservations
      WHERE reservation_date = ?
    `, [date]);

    res.json({
      success: true,
      data: { 
        stats: stats[0],
        date
      }
    });
  } catch (error) {
    console.error('Get reservation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservation statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllReservations,
  getUserReservations,
  getReservationById,
  createReservation,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
  deleteReservation,
  getReservationStats
};
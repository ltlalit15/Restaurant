const db = require('../config/database');
const axios = require('axios');

// Get all printers
const getAllPrinters = async (req, res) => {
  try {
    const [printers] = await db.execute(
      'SELECT * FROM printers ORDER BY name'
    );

    res.json({
      success: true,
      data: { printers }
    });
  } catch (error) {
    console.error('Get all printers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching printers',
      error: error.message
    });
  }
};

// Get printer by ID
const getPrinterById = async (req, res) => {
  try {
    const { id } = req.params;
    const [printers] = await db.execute(
      'SELECT * FROM printers WHERE id = ?',
      [id]
    );

    if (printers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    res.json({
      success: true,
      data: { printer: printers[0] }
    });
  } catch (error) {
    console.error('Get printer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching printer',
      error: error.message
    });
  }
};

// Create new printer
const createPrinter = async (req, res) => {
  try {
    const { printer_id, name, type, ip_address, port } = req.body;

    // Check if printer_id already exists
    const [existing] = await db.execute(
      'SELECT id FROM printers WHERE printer_id = ?',
      [printer_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Printer ID already exists'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO printers (printer_id, name, type, ip_address, port) VALUES (?, ?, ?, ?, ?)',
      [printer_id, name, type, ip_address, port || 9100]
    );

    const [printer] = await db.execute(
      'SELECT * FROM printers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Printer created successfully',
      data: { printer: printer[0] }
    });
  } catch (error) {
    console.error('Create printer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating printer',
      error: error.message
    });
  }
};

// Update printer
const updatePrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const { printer_id, name, type, ip_address, port, status } = req.body;

    // Check if printer exists
    const [existing] = await db.execute(
      'SELECT * FROM printers WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    // Check if printer_id is already taken by another printer
    if (printer_id !== existing[0].printer_id) {
      const [duplicate] = await db.execute(
        'SELECT id FROM printers WHERE printer_id = ? AND id != ?',
        [printer_id, id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Printer ID already exists'
        });
      }
    }

    const [result] = await db.execute(
      `UPDATE printers SET printer_id = ?, name = ?, type = ?, ip_address = ?, 
       port = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [printer_id, name, type, ip_address, port, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update printer'
      });
    }

    const [printer] = await db.execute(
      'SELECT * FROM printers WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Printer updated successfully',
      data: { printer: printer[0] }
    });
  } catch (error) {
    console.error('Update printer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating printer',
      error: error.message
    });
  }
};

// Test printer
const testPrinter = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [printers] = await db.execute(
      'SELECT * FROM printers WHERE id = ?',
      [id]
    );

    if (printers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    const printer = printers[0];

    // Call printer API to test print
    try {
      const response = await axios.post(`${process.env.PRINTER_API_URL}/test`, {
        printer_id: printer.printer_id,
        ip_address: printer.ip_address,
        port: printer.port,
        type: printer.type
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Update printer status to online if test successful
      await db.execute(
        'UPDATE printers SET status = "online", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Test print sent successfully',
        data: { 
          printer_id: printer.printer_id,
          response: response.data
        }
      });
    } catch (apiError) {
      // Update printer status to error
      await db.execute(
        'UPDATE printers SET status = "error", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      res.status(400).json({
        success: false,
        message: 'Printer test failed',
        error: apiError.response?.data?.message || apiError.message
      });
    }
  } catch (error) {
    console.error('Test printer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing printer',
      error: error.message
    });
  }
};

// Print order (KOT)
const printOrder = async (req, res) => {
  try {
    const { order_id, printer_type } = req.body;

    // Get order details
    const [orders] = await db.execute(`
      SELECT o.*, t.table_number, t.table_name
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.id = ?
    `, [order_id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items with menu details
    const [items] = await db.execute(`
      SELECT oi.*, mi.name as item_name, mi.printer_id
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `, [order_id]);

    // Group items by printer
    const printerGroups = {};
    items.forEach(item => {
      const printerId = item.printer_id || 'default';
      if (!printerGroups[printerId]) {
        printerGroups[printerId] = [];
      }
      printerGroups[printerId].push(item);
    });

    const printResults = [];

    // Send to each printer
    for (const [printerId, printerItems] of Object.entries(printerGroups)) {
      try {
        // Get printer details
        const [printers] = await db.execute(
          'SELECT * FROM printers WHERE printer_id = ? AND status = "online"',
          [printerId]
        );

        if (printers.length === 0) {
          printResults.push({
            printer_id: printerId,
            success: false,
            message: 'Printer not found or offline'
          });
          continue;
        }

        const printer = printers[0];

        // Call printer API
        const response = await axios.post(`${process.env.PRINTER_API_URL}/print-kot`, {
          printer_id: printer.printer_id,
          ip_address: printer.ip_address,
          port: printer.port,
          order: {
            order_number: order.order_number,
            table_number: order.table_number,
            table_name: order.table_name,
            customer_name: order.customer_name,
            items: printerItems,
            created_at: order.created_at
          }
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.PRINTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        printResults.push({
          printer_id: printerId,
          success: true,
          message: 'KOT printed successfully',
          response: response.data
        });
      } catch (apiError) {
        printResults.push({
          printer_id: printerId,
          success: false,
          message: 'Print failed',
          error: apiError.response?.data?.message || apiError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Print job completed',
      data: { 
        order_id,
        results: printResults
      }
    });
  } catch (error) {
    console.error('Print order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error printing order',
      error: error.message
    });
  }
};

// Print receipt
const printReceipt = async (req, res) => {
  try {
    const { session_id, payment_details } = req.body;

    // Get session and order details
    const [sessions] = await db.execute(`
      SELECT s.*, t.table_number, t.table_name, u.name as user_name
      FROM sessions s
      JOIN tables t ON s.table_id = t.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [session_id]);

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Get orders for this session
    const [orders] = await db.execute(`
      SELECT o.*, 
             GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.name, ' @ $', oi.unit_price) SEPARATOR '\n') as items_summary,
             SUM(oi.total_price) as items_total
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.session_id = ?
      GROUP BY o.id
    `, [session_id]);

    // Get receipt printer
    const [printers] = await db.execute(
      'SELECT * FROM printers WHERE type = "receipt" AND status = "online" LIMIT 1'
    );

    if (printers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No receipt printer available'
      });
    }

    const printer = printers[0];

    try {
      // Call printer API for receipt
      const response = await axios.post(`${process.env.PRINTER_API_URL}/print-receipt`, {
        printer_id: printer.printer_id,
        ip_address: printer.ip_address,
        port: printer.port,
        receipt: {
          session_id: session.session_id,
          table_number: session.table_number,
          table_name: session.table_name,
          customer_name: session.customer_name,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes,
          session_cost: session.session_cost,
          orders: orders,
          payment_details: payment_details,
          total_amount: payment_details.total_amount
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      res.json({
        success: true,
        message: 'Receipt printed successfully',
        data: { 
          session_id,
          printer_id: printer.printer_id,
          response: response.data
        }
      });
    } catch (apiError) {
      res.status(400).json({
        success: false,
        message: 'Receipt print failed',
        error: apiError.response?.data?.message || apiError.message
      });
    }
  } catch (error) {
    console.error('Print receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error printing receipt',
      error: error.message
    });
  }
};

// Update printer status
const updatePrinterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['online', 'offline', 'error'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const [result] = await db.execute(
      'UPDATE printers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    res.json({
      success: true,
      message: 'Printer status updated successfully',
      data: { printer_id: id, status }
    });
  } catch (error) {
    console.error('Update printer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating printer status',
      error: error.message
    });
  }
};

// Delete printer
const deletePrinter = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM printers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    res.json({
      success: true,
      message: 'Printer deleted successfully'
    });
  } catch (error) {
    console.error('Delete printer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting printer',
      error: error.message
    });
  }
};

module.exports = {
  getAllPrinters,
  getPrinterById,
  createPrinter,
  updatePrinter,
  testPrinter,
  printOrder,
  printReceipt,
  updatePrinterStatus,
  deletePrinter
};
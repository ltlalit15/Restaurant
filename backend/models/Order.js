const db = require('../config/database');

class Order {
  // Create new order
  static async create(orderData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        session_id, 
        table_id, 
        user_id, 
        customer_name, 
        order_type = 'dine_in',
        special_instructions,
        items 
      } = orderData;
      
      // Generate order number
      const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        const [menuItem] = await connection.execute(
          'SELECT price FROM menu_items WHERE id = ?',
          [item.menu_item_id]
        );
        if (menuItem.length > 0) {
          subtotal += menuItem[0].price * item.quantity;
        }
      }
      
      const tax_amount = subtotal * 0.085; // 8.5% tax
      const total_amount = subtotal + tax_amount;
      
      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (order_number, session_id, table_id, user_id, customer_name, 
         order_type, subtotal, tax_amount, total_amount, special_instructions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_number, session_id, table_id, user_id, customer_name, order_type, 
         subtotal, tax_amount, total_amount, special_instructions]
      );
      
      const orderId = orderResult.insertId;
      
      // Add order items
      for (const item of items) {
        const [menuItem] = await connection.execute(
          'SELECT price FROM menu_items WHERE id = ?',
          [item.menu_item_id]
        );
        
        if (menuItem.length > 0) {
          const unit_price = menuItem[0].price;
          const total_price = unit_price * item.quantity;
          
          await connection.execute(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, item.menu_item_id, item.quantity, unit_price, total_price, item.special_instructions || null]
          );
        }
      }
      
      await connection.commit();
      return orderId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get order by ID with items
  static async findById(id) {
    const [orders] = await db.execute(
      `SELECT o.*, t.table_number, t.table_name, u.name as user_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (orders.length === 0) return null;
    
    const order = orders[0];
    
    // Get order items
    const [items] = await db.execute(
      `SELECT oi.*, mi.name as item_name, mi.description as item_description
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [id]
    );
    
    order.items = items;
    return order;
  }

  // Get all orders with pagination and filters
  static async getAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT o.*, t.table_number, t.table_name, u.name as user_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.user_id = u.id
    `;
    
    let params = [];
    let conditions = [];
    
    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
    }
    
    if (filters.table_id) {
      conditions.push('o.table_id = ?');
      params.push(filters.table_id);
    }
    
    if (filters.date) {
      conditions.push('DATE(o.created_at) = ?');
      params.push(filters.date);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [orders] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders o';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    return {
      orders,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Update order status
  static async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    return result.affectedRows > 0;
  }

  // Update order item status
  static async updateItemStatus(orderItemId, status) {
    const [result] = await db.execute(
      'UPDATE order_items SET status = ? WHERE id = ?',
      [status, orderItemId]
    );
    
    return result.affectedRows > 0;
  }

  // Get orders by table
  static async getByTable(tableId) {
    const [orders] = await db.execute(
      `SELECT o.*, u.name as user_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.table_id = ?
       ORDER BY o.created_at DESC`,
      [tableId]
    );
    
    return orders;
  }

  // Get orders by session
  static async getBySession(sessionId) {
    const [orders] = await db.execute(
      `SELECT o.*, t.table_number, t.table_name, u.name as user_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.session_id = ?
       ORDER BY o.created_at DESC`,
      [sessionId]
    );
    
    return orders;
  }

  // Get pending orders for kitchen/bar
  static async getPendingOrders() {
    const [orders] = await db.execute(
      `SELECT o.id, o.order_number, o.created_at, t.table_number, t.table_name,
              oi.id as item_id, oi.quantity, oi.special_instructions, oi.status as item_status,
              mi.name as item_name, mi.printer_id
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       JOIN tables t ON o.table_id = t.id
       WHERE oi.status IN ('pending', 'preparing')
       ORDER BY o.created_at ASC`
    );
    
    return orders;
  }

  // Get order statistics
  static async getStats(date = null) {
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_orders,
        SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) as served_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders
    `;
    
    let params = [];
    
    if (date) {
      query += ' WHERE DATE(created_at) = ?';
      params.push(date);
    }
    
    const [stats] = await db.execute(query, params);
    return stats[0];
  }

  // Delete order
  static async delete(id) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Delete order items first
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
      
      // Delete order
      const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [id]);
      
      await connection.commit();
      return result.affectedRows > 0;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Order;
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let orders = [];
let orderCounter = 1;

router.get('/', (req, res) => {
  const { status, orderType, limit = 50 } = req.query;
  
  let filteredOrders = orders;
  
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  
  if (orderType) {
    filteredOrders = filteredOrders.filter(order => order.orderType === orderType);
  }
  
  filteredOrders = filteredOrders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, parseInt(limit));

  res.json({
    success: true,
    orders: filteredOrders,
    total: filteredOrders.length
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    order
  });
});

router.post('/', async (req, res) => {
  try {
    const { 
      table, 
      customer, 
      orderType = 'dineIn', 
      items = [], 
      specialInstructions = '',
      paymentStatus = 'pending'
    } = req.body;

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const orderId = `ORD-${new Date().getFullYear()}-${String(orderCounter).padStart(4, '0')}`;
    orderCounter++;

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      id: orderId,
      table: table || 'N/A',
      customer: customer || 'Walk-in',
      orderType,
      items,
      specialInstructions,
      total,
      paymentStatus,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(order);

    const kotResponse = await fetch('http://localhost:3001/api/kot/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order,
        printerType: 'kitchen'
      })
    }).catch(err => {
      console.log('KOT print failed:', err.message);
      return { ok: false };
    });

    res.json({
      success: true,
      message: 'Order created successfully',
      order,
      kotPrinted: kotResponse?.ok || false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to create order: ${error.message}`
    });
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();

    if (status === 'completed') {
      orders[orderIndex].completedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: orders[orderIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update order status: ${error.message}`
    });
  }
});

router.post('/:id/reprint-kot', async (req, res) => {
  try {
    const { id } = req.params;
    const { printerType = 'kitchen' } = req.body;

    const order = orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const kotResponse = await fetch('http://localhost:3001/api/kot/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order,
        printerType
      })
    });

    const kotResult = await kotResponse.json();

    res.json({
      success: true,
      message: 'KOT reprinted successfully',
      order,
      kotResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to reprint KOT: ${error.message}`
    });
  }
});

module.exports = router;

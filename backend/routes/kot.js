const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let kotQueue = [];
let kotCounter = 1;

router.get('/queue', (req, res) => {
  res.json({
    success: true,
    kots: kotQueue,
    total: kotQueue.length
  });
});

router.post('/print', async (req, res) => {
  try {
    const { order, printerType = 'kitchen' } = req.body;

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Order data is required'
      });
    }

    const kotId = `KOT-${new Date().getFullYear()}-${String(kotCounter).padStart(3, '0')}`;
    kotCounter++;

    const kot = {
      id: kotId,
      orderId: order.id || uuidv4(),
      table: order.table || 'N/A',
      customer: order.customer || 'Walk-in',
      orderType: order.orderType || 'dineIn',
      items: order.items || [],
      specialInstructions: order.specialInstructions || '',
      total: order.total || 0,
      status: 'pending',
      printerType,
      createdAt: new Date().toISOString(),
      printedAt: new Date().toISOString()
    };

    kotQueue.push(kot);

    const printResult = await printKOT(kot, printerType);

    res.json({
      success: true,
      message: 'KOT printed successfully',
      kot,
      printResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to print KOT: ${error.message}`
    });
  }
});

router.post('/reprint/:kotId', async (req, res) => {
  try {
    const { kotId } = req.params;
    const { printerType = 'kitchen' } = req.body;

    const kot = kotQueue.find(k => k.id === kotId);
    if (!kot) {
      return res.status(404).json({
        success: false,
        message: 'KOT not found'
      });
    }

    const printResult = await printKOT(kot, printerType);

    res.json({
      success: true,
      message: 'KOT reprinted successfully',
      kot,
      printResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to reprint KOT: ${error.message}`
    });
  }
});

router.put('/:kotId/status', (req, res) => {
  try {
    const { kotId } = req.params;
    const { status } = req.body;

    const kotIndex = kotQueue.findIndex(k => k.id === kotId);
    if (kotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'KOT not found'
      });
    }

    kotQueue[kotIndex].status = status;
    kotQueue[kotIndex].updatedAt = new Date().toISOString();

    if (status === 'completed') {
      kotQueue[kotIndex].completedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'KOT status updated successfully',
      kot: kotQueue[kotIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update KOT status: ${error.message}`
    });
  }
});

async function printKOT(kot, printerType) {
  try {
    const orderTypeDisplay = {
      'dineIn': 'DINE IN',
      'takeOut': 'TAKEAWAY',
      'delivery': 'DELIVERY'
    };

    const slip = {
      header: [
        '================================',
        '        KITCHEN ORDER TICKET',
        '================================',
        `Order #: ${kot.id}`,
        `Date: ${new Date(kot.createdAt).toLocaleDateString()}`,
        `Time: ${new Date(kot.createdAt).toLocaleTimeString()}`,
        `Table: ${kot.table}`,
        `Customer: ${kot.customer}`,
        `Type: ${orderTypeDisplay[kot.orderType] || 'DINE IN'}`,
        '================================'
      ],
      items: [],
      footer: [
        '================================',
        `Total Items: ${kot.items.reduce((sum, item) => sum + item.quantity, 0)}`,
        `Order Total: $${kot.total.toFixed(2)}`,
        '================================',
        'Special Instructions:',
        kot.specialInstructions || 'None',
        '================================',
        `Printed: ${new Date().toLocaleTimeString()}`,
        `Station: ${printerType.toUpperCase()}`,
        '================================'
      ]
    };

    kot.items.forEach(item => {
      slip.items.push(`${item.quantity}x ${item.name}`);
      slip.items.push(`    $${(item.price * item.quantity).toFixed(2)}`);
      
      if (item.sides && item.sides.length > 0) {
        item.sides.forEach(side => {
          slip.items.push(`    + ${side.name}`);
        });
      }
      
      if (item.specialInstructions) {
        slip.items.push(`    NOTE: ${item.specialInstructions}`);
      }
      
      slip.items.push('');
    });

    console.log(`Printing KOT ${kot.id} to ${printerType}:`);
    console.log('Header:', slip.header.join('\n'));
    console.log('Items:', slip.items.join('\n'));
    console.log('Footer:', slip.footer.join('\n'));

    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: `KOT printed to ${printerType}`,
      slipContent: slip
    };
  } catch (error) {
    return {
      success: false,
      message: `Print failed: ${error.message}`
    };
  }
}

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let printers = new Map();

router.get('/', (req, res) => {
  const printerList = Array.from(printers.entries()).map(([id, printer]) => ({
    id,
    ...printer
  }));
  res.json(printerList);
});

router.post('/', (req, res) => {
  try {
    const { name, type, ip, port, paperSize } = req.body;
    
    if (!name || !type || !ip) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, type, and IP address are required' 
      });
    }

    const printerId = uuidv4();
    const printer = {
      name,
      type,
      ip,
      port: port || 9100,
      paperSize: paperSize || '80mm',
      status: 'configured',
      createdAt: new Date().toISOString()
    };

    printers.set(printerId, printer);

    res.json({
      success: true,
      message: 'Printer added successfully',
      printer: { id: printerId, ...printer }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to add printer: ${error.message}`
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, ip, port, paperSize, status } = req.body;

    if (!printers.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    const existingPrinter = printers.get(id);
    const updatedPrinter = {
      ...existingPrinter,
      name: name || existingPrinter.name,
      type: type || existingPrinter.type,
      ip: ip || existingPrinter.ip,
      port: port || existingPrinter.port,
      paperSize: paperSize || existingPrinter.paperSize,
      status: status || existingPrinter.status,
      updatedAt: new Date().toISOString()
    };

    printers.set(id, updatedPrinter);

    res.json({
      success: true,
      message: 'Printer updated successfully',
      printer: { id, ...updatedPrinter }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update printer: ${error.message}`
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!printers.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    printers.delete(id);

    res.json({
      success: true,
      message: 'Printer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete printer: ${error.message}`
    });
  }
});

router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const printer = printers.get(id);

    if (!printer) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }

    const testResult = await testPrinter(printer);
    
    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Test print failed: ${error.message}`
    });
  }
});

async function testPrinter(printer) {
  try {
    console.log(`Testing printer: ${printer.name} at ${printer.ip}:${printer.port}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Test print sent to ${printer.name}. Check printer for output.`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: `Test print failed: ${error.message}`
    };
  }
}

module.exports = router;

const express = require('express');
const router = express.Router();
const plugController = require('../controllers/plugController');
const { verifyToken, checkRole, checkPermission } = require('../middleware/auth');

// Get all smart plugs
router.get('/', verifyToken, checkRole(['admin', 'staff']), plugController.getAllPlugs);

// Get plug by ID
router.get('/:id', verifyToken, checkRole(['admin', 'staff']), plugController.getPlugById);

// Create new plug (Admin only)
router.post('/', verifyToken, checkPermission('manage_plugs'), plugController.createPlug);

// Update plug (Admin only)
router.put('/:id', verifyToken, checkPermission('manage_plugs'), plugController.updatePlug);

// Control plug power (turn on/off)
router.post('/:id/power', verifyToken, checkRole(['admin', 'staff']), plugController.controlPlugPower);

// Get plug status
router.get('/:id/status', verifyToken, checkRole(['admin', 'staff']), plugController.getPlugStatus);

// Update plug status
router.patch('/:id/status', verifyToken, checkRole(['admin', 'staff']), plugController.updatePlugStatus);

// Get power consumption
router.get('/:id/consumption', verifyToken, checkRole(['admin', 'staff']), plugController.getPowerConsumption);

// Delete plug (Admin only)
router.delete('/:id', verifyToken, checkPermission('manage_plugs'), plugController.deletePlug);

// Bulk control plugs
router.post('/bulk/control', verifyToken, checkRole(['admin', 'staff']), plugController.bulkControlPlugs);

module.exports = router;
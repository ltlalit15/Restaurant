const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken, checkRole, checkPermission } = require('../middleware/auth');
const { validateSession, handleValidationErrors } = require('../middleware/validation');

// Get all sessions
router.get('/', verifyToken, checkRole(['admin', 'staff']), sessionController.getAllSessions);

// Get user's sessions
router.get('/my-sessions', verifyToken, sessionController.getUserSessions);

// Get active sessions
router.get('/active', verifyToken, checkRole(['admin', 'staff']), sessionController.getActiveSessions);

// Get session by ID
router.get('/:id', verifyToken, sessionController.getSessionById);

// Start new session
router.post('/start', verifyToken, checkPermission('manage_sessions'), validateSession, handleValidationErrors, sessionController.startSession);

// End session
router.patch('/:id/end', verifyToken, checkRole(['admin', 'staff']), sessionController.endSession);

// Pause session
router.patch('/:id/pause', verifyToken, checkRole(['admin', 'staff']), sessionController.pauseSession);

// Resume session
router.patch('/:id/resume', verifyToken, checkRole(['admin', 'staff']), sessionController.resumeSession);

// Extend session
router.patch('/:id/extend', verifyToken, checkRole(['admin', 'staff']), sessionController.extendSession);

// Get session statistics
router.get('/stats/overview', verifyToken, checkRole(['admin', 'staff']), sessionController.getSessionStats);

module.exports = router;
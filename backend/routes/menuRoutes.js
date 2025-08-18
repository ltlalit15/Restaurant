const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole, checkPermission } = require('../middleware/auth');
const { validateMenuItem, handleValidationErrors } = require('../middleware/validation');

// Get all menu categories
router.get('/categories', menuController.getAllCategories);

// Get all menu items
router.get('/items', menuController.getAllMenuItems);

// Get menu items by category
router.get('/categories/:categoryId/items', menuController.getItemsByCategory);

// Get menu item by ID
router.get('/items/:id', menuController.getMenuItemById);

// Create new category (Admin only)
router.post('/categories', verifyToken, checkPermission('manage_menu'), menuController.createCategory);

// Create new menu item (Admin only)
router.post('/items', verifyToken, checkPermission('manage_menu'), validateMenuItem, handleValidationErrors, menuController.createMenuItem);

// Update category (Admin only)
router.put('/categories/:id', verifyToken, checkPermission('manage_menu'), menuController.updateCategory);

// Update menu item (Admin only)
router.put('/items/:id', verifyToken, checkPermission('manage_menu'), menuController.updateMenuItem);

// Delete category (Admin only)
router.delete('/categories/:id', verifyToken, checkPermission('manage_menu'), menuController.deleteCategory);

// Delete menu item (Admin only)
router.delete('/items/:id', verifyToken, checkPermission('manage_menu'), menuController.deleteMenuItem);

module.exports = router;
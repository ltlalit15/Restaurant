const db = require('../config/database');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.execute(
      'SELECT * FROM menu_categories WHERE status = "active" ORDER BY name'
    );

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get all menu items
const getAllMenuItems = async (req, res) => {
  try {
    const { category_id, status } = req.query;
    
    let query = `
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
    `;
    
    let params = [];
    let conditions = [];
    
    if (category_id) {
      conditions.push('mi.category_id = ?');
      params.push(category_id);
    }
    
    if (status) {
      conditions.push('mi.status = ?');
      params.push(status);
    } else {
      conditions.push('mi.status = "available"');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY mc.name, mi.name';
    
    const [items] = await db.execute(query, params);

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items',
      error: error.message
    });
  }
};

// Get items by category
const getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const [items] = await db.execute(
      `SELECT mi.*, mc.name as category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.category_id = ? AND mi.status = "available"
       ORDER BY mi.name`,
      [categoryId]
    );

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items by category',
      error: error.message
    });
  }
};

// Get menu item by ID
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [items] = await db.execute(
      `SELECT mi.*, mc.name as category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: { item: items[0] }
    });
  } catch (error) {
    console.error('Get menu item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item',
      error: error.message
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const [result] = await db.execute(
      'INSERT INTO menu_categories (name, description) VALUES (?, ?)',
      [name, description]
    );

    const [category] = await db.execute(
      'SELECT * FROM menu_categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: category[0] }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// Create new menu item
const createMenuItem = async (req, res) => {
  try {
    const { name, description, category_id, price, cost_price, printer_id, image_url } = req.body;

    const [result] = await db.execute(
      'INSERT INTO menu_items (name, description, category_id, price, cost_price, printer_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, category_id, price, cost_price, printer_id, image_url]
    );

    const [item] = await db.execute(
      `SELECT mi.*, mc.name as category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { item: item[0] }
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const [result] = await db.execute(
      'UPDATE menu_categories SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const [category] = await db.execute(
      'SELECT * FROM menu_categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: category[0] }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, price, cost_price, status, printer_id, image_url } = req.body;

    const [result] = await db.execute(
      `UPDATE menu_items SET name = ?, description = ?, category_id = ?, price = ?, 
       cost_price = ?, status = ?, printer_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, description, category_id, price, cost_price, status, printer_id, image_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const [item] = await db.execute(
      `SELECT mi.*, mc.name as category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { item: item[0] }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has menu items
    const [items] = await db.execute(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [id]
    );

    if (items[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing menu items'
      });
    }

    const [result] = await db.execute(
      'DELETE FROM menu_categories WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM menu_items WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getAllMenuItems,
  getItemsByCategory,
  getMenuItemById,
  createCategory,
  createMenuItem,
  updateCategory,
  updateMenuItem,
  deleteCategory,
  deleteMenuItem
};
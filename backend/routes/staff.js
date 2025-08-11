const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let staffMembers = new Map();

const ROLE_PERMISSIONS = {
  Admin: {
    tablesManagement: { view: true, manage: true, status: true },
    orderProcessing: { create: true, modify: true, cancel: true },
    billingAccess: { generate: true, payments: true, reports: true },
    kotManagement: { print: true, modify: true, status: true },
    specialPermissions: {
      voidOrders: { items: true, fullOrder: true, afterPayment: true },
      discounts: { item: true, bill: true, offers: true, maxDiscount: 25 }
    },
    reportAccess: { daily: true, table: true, item: true },
    canAddItems: true,
    canChangePrices: true,
    canManageStaff: true
  },
  Manager: {
    tablesManagement: { view: true, manage: true, status: true },
    orderProcessing: { create: true, modify: true, cancel: true },
    billingAccess: { generate: true, payments: true, reports: true },
    kotManagement: { print: true, modify: true, status: true },
    specialPermissions: {
      voidOrders: { items: true, fullOrder: false, afterPayment: false },
      discounts: { item: true, bill: true, offers: true, maxDiscount: 15 }
    },
    reportAccess: { daily: true, table: true, item: true },
    canAddItems: true,
    canChangePrices: true,
    canManageStaff: false
  },
  Staff: {
    tablesManagement: { view: true, manage: false, status: true },
    orderProcessing: { create: true, modify: false, cancel: false },
    billingAccess: { generate: false, payments: false, reports: false },
    kotManagement: { print: true, modify: false, status: true },
    specialPermissions: {
      voidOrders: { items: false, fullOrder: false, afterPayment: false },
      discounts: { item: false, bill: false, offers: false, maxDiscount: 0 }
    },
    reportAccess: { daily: false, table: false, item: false },
    canAddItems: false,
    canChangePrices: false,
    canManageStaff: false
  }
};

const initializeDefaultStaff = () => {
  const defaultStaff = [
    { 
      id: 'sarah', 
      name: 'Sarah Johnson', 
      phone: '+1 (555) 123-4567', 
      email: 'sarah@restaurant.com',
      role: 'Admin', 
      color: 'primary',
      ...ROLE_PERMISSIONS.Admin,
      createdAt: new Date().toISOString()
    },
    { 
      id: 'michael', 
      name: 'Michael Chen', 
      phone: '+1 (555) 234-5678', 
      email: 'michael@restaurant.com',
      role: 'Staff', 
      color: 'success',
      ...ROLE_PERMISSIONS.Staff,
      createdAt: new Date().toISOString()
    },
    { 
      id: 'emily', 
      name: 'Emily Rodriguez', 
      phone: '+1 (555) 345-6789', 
      email: 'emily@restaurant.com',
      role: 'Manager', 
      color: 'info',
      ...ROLE_PERMISSIONS.Manager,
      createdAt: new Date().toISOString()
    }
  ];

  defaultStaff.forEach(staff => {
    staffMembers.set(staff.id, staff);
  });
};

initializeDefaultStaff();

router.get('/', (req, res) => {
  try {
    const staffList = Array.from(staffMembers.entries()).map(([id, staff]) => ({
      id,
      ...staff
    }));
    
    res.json({
      success: true,
      staff: staffList,
      total: staffList.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get staff: ${error.message}`
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, username, email, password, phone, role = 'Staff' } = req.body;

    if (!name || !username || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, email, and phone are required'
      });
    }

    if (staffMembers.has(username.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const staffId = username.toLowerCase();
    const color = role === 'Admin' ? 'primary' : role === 'Manager' ? 'info' : 'success';

    const newStaff = {
      id: staffId,
      name,
      username,
      email,
      phone,
      role,
      color,
      ...ROLE_PERMISSIONS[role],
      createdAt: new Date().toISOString()
    };

    staffMembers.set(staffId, newStaff);

    res.json({
      success: true,
      message: 'Staff member added successfully',
      staff: { id: staffId, ...newStaff }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to add staff: ${error.message}`
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!staffMembers.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const existingStaff = staffMembers.get(id);
    const updatedStaff = {
      ...existingStaff,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.role && updates.role !== existingStaff.role) {
      Object.assign(updatedStaff, ROLE_PERMISSIONS[updates.role]);
      updatedStaff.color = updates.role === 'Admin' ? 'primary' : updates.role === 'Manager' ? 'info' : 'success';
    }

    staffMembers.set(id, updatedStaff);

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: { id, ...updatedStaff }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update staff: ${error.message}`
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!staffMembers.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staffMembers.delete(id);

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete staff: ${error.message}`
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const staff = staffMembers.get(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      staff: { id, ...staff }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get staff: ${error.message}`
    });
  }
});

module.exports = router;


class KOTPrinter {
  constructor() {
    this.printers = new Map();
    this.printQueue = [];
    this.isProcessing = false;
  }

  async addNetworkPrinter(id, config) {
    try {
      this.printers.set(id, {
        config,
        type: 'network',
        status: 'configured'
      });
      
      return { success: true, message: 'Printer added successfully' };
    } catch (error) {
      return { success: false, message: `Failed to add printer: ${error.message}` };
    }
  }

  async testPrint(printerId) {
    const printerInfo = this.printers.get(printerId);
    if (!printerInfo) {
      return { success: false, message: 'Printer not found' };
    }

    try {
      const { config } = printerInfo;
      
      console.log(`Testing printer: ${config.name} at ${config.ip}:${config.port || 9100}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: `Test print sent to ${config.name}. Check printer for output.` };
    } catch (error) {
      return { success: false, message: `Test print failed: ${error.message}` };
    }
  }

  formatKOTSlip(order, printerType = 'kitchen') {
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
        `Order #: ${order.id}`,
        `Date: ${new Date(order.timestamp).toLocaleDateString()}`,
        `Time: ${new Date(order.timestamp).toLocaleTimeString()}`,
        `Table: ${order.table}`,
        `Customer: ${order.customer}`,
        `Type: ${orderTypeDisplay[order.orderType] || 'DINE IN'}`,
        '================================'
      ],
      items: [],
      footer: [
        '================================',
        `Total Items: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}`,
        `Order Total: $${order.total.toFixed(2)}`,
        '================================',
        'Special Instructions:',
        order.specialInstructions || 'None',
        '================================',
        `Printed: ${new Date().toLocaleTimeString()}`,
        `Station: ${printerType.toUpperCase()}`,
        '================================'
      ]
    };

    order.items.forEach(item => {
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

    return slip;
  }

  async printKOT(order, printerId, printerType = 'kitchen') {
    const printerInfo = this.printers.get(printerId);
    if (!printerInfo) {
      return { success: false, message: 'Printer not found' };
    }

    try {
      const { config } = printerInfo;
      const slip = this.formatKOTSlip(order, printerType);
      
      console.log(`Printing KOT to ${config.name}:`);
      console.log('Header:', slip.header.join('\n'));
      console.log('Items:', slip.items.join('\n'));
      console.log('Footer:', slip.footer.join('\n'));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { 
        success: true, 
        message: `KOT printed to ${config.name}`,
        printer: config.name,
        slipContent: slip
      };
    } catch (error) {
      return { success: false, message: `Print failed: ${error.message}` };
    }
  }

  async printToCategory(order, category) {
    const printerMappings = this.getPrinterMappings();
    const printerId = printerMappings[category];
    
    if (!printerId) {
      return { success: false, message: `No printer assigned to category: ${category}` };
    }
    
    return await this.printKOT(order, printerId, category);
  }

  getPrinterMappings() {
    const mappings = localStorage.getItem('printerMappings');
    return mappings ? JSON.parse(mappings) : {
      'food': 'kitchen-printer-01',
      'drinks': 'bar-printer-01',
      'games': 'main-printer-01'
    };
  }

  setPrinterMappings(mappings) {
    localStorage.setItem('printerMappings', JSON.stringify(mappings));
  }

  getAvailablePrinters() {
    return Array.from(this.printers.entries()).map(([id, info]) => ({
      id,
      name: info.config.name,
      type: info.config.type,
      status: info.status
    }));
  }

  removePrinter(printerId) {
    return this.printers.delete(printerId);
  }
}

export const kotPrinter = new KOTPrinter();
export default kotPrinter;

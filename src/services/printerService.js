import kotPrinter from '../utils/kotPrinter';

class PrinterService {
  constructor() {
    this.printQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 2000;
  }

  async addPrintJob(order, category, priority = 'normal') {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order,
      category,
      priority,
      attempts: 0,
      timestamp: new Date().toISOString()
    };

    if (priority === 'high') {
      this.printQueue.unshift(job);
    } else {
      this.printQueue.push(job);
    }

    if (!this.isProcessing) {
      this.processQueue();
    }

    return job.id;
  }

  async processQueue() {
    if (this.isProcessing || this.printQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.printQueue.length > 0) {
      const job = this.printQueue.shift();
      await this.executeJob(job);
    }

    this.isProcessing = false;
  }

  async executeJob(job) {
    try {
      const result = await kotPrinter.printToCategory(job.order, job.category);
      
      if (result.success) {
        console.log(`Print job ${job.id} completed successfully`);
        this.onJobComplete(job, true);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      job.attempts++;
      console.error(`Print job ${job.id} failed (attempt ${job.attempts}):`, error.message);
      
      if (job.attempts < this.retryAttempts) {
        setTimeout(() => {
          this.printQueue.unshift(job);
          if (!this.isProcessing) {
            this.processQueue();
          }
        }, this.retryDelay);
      } else {
        console.error(`Print job ${job.id} failed after ${this.retryAttempts} attempts`);
        this.onJobComplete(job, false, error.message);
      }
    }
  }

  onJobComplete(job, success, error = null) {
    const event = new CustomEvent('printJobComplete', {
      detail: {
        jobId: job.id,
        orderId: job.order.id,
        success,
        error,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }

  getQueueStatus() {
    return {
      queueLength: this.printQueue.length,
      isProcessing: this.isProcessing,
      jobs: this.printQueue.map(job => ({
        id: job.id,
        orderId: job.order.id,
        category: job.category,
        priority: job.priority,
        attempts: job.attempts,
        timestamp: job.timestamp
      }))
    };
  }

  clearQueue() {
    this.printQueue = [];
    this.isProcessing = false;
  }

  async checkPrinterHealth() {
    const printers = kotPrinter.getAvailablePrinters();
    const healthStatus = {};

    for (const printer of printers) {
      try {
        const result = await kotPrinter.testPrint(printer.id);
        healthStatus[printer.id] = {
          name: printer.name,
          status: result.success ? 'healthy' : 'error',
          lastCheck: new Date().toISOString(),
          error: result.success ? null : result.message
        };
      } catch (error) {
        healthStatus[printer.id] = {
          name: printer.name,
          status: 'error',
          lastCheck: new Date().toISOString(),
          error: error.message
        };
      }
    }

    return healthStatus;
  }

  async discoverNetworkPrinters(ipRange = '192.168.1') {
    const discoveredPrinters = [];
    const commonPorts = [9100, 515, 631];
    
    for (let i = 1; i <= 254; i++) {
      const ip = `${ipRange}.${i}`;
      
      for (const port of commonPorts) {
        try {
          const result = await this.testConnection(ip, port);
          if (result.success) {
            discoveredPrinters.push({
              ip,
              port,
              name: `Printer at ${ip}:${port}`,
              type: 'Network Printer'
            });
          }
        } catch (error) {
          continue;
        }
      }
    }

    return discoveredPrinters;
  }

  async testConnection(ip, port, timeout = 3000) {
    return new Promise((resolve) => {
      const socket = new WebSocket(`ws://${ip}:${port}`);
      const timer = setTimeout(() => {
        socket.close();
        resolve({ success: false, message: 'Connection timeout' });
      }, timeout);

      socket.onopen = () => {
        clearTimeout(timer);
        socket.close();
        resolve({ success: true, message: 'Connection successful' });
      };

      socket.onerror = () => {
        clearTimeout(timer);
        resolve({ success: false, message: 'Connection failed' });
      };
    });
  }
}

export const printerService = new PrinterService();
export default printerService;

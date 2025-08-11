const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const printerAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/printers`);
    return response.json();
  },

  add: async (printer) => {
    const response = await fetch(`${API_BASE_URL}/api/printers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printer)
    });
    return response.json();
  },

  update: async (id, printer) => {
    const response = await fetch(`${API_BASE_URL}/api/printers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printer)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/printers/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  test: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/printers/${id}/test`, {
      method: 'POST'
    });
    return response.json();
  }
};

export const kotAPI = {
  print: async (order, printerType = 'kitchen') => {
    const response = await fetch(`${API_BASE_URL}/api/kot/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order, printerType })
    });
    return response.json();
  },

  getQueue: async () => {
    const response = await fetch(`${API_BASE_URL}/api/kot/queue`);
    return response.json();
  },

  reprint: async (kotId, printerType = 'kitchen') => {
    const response = await fetch(`${API_BASE_URL}/api/kot/reprint/${kotId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ printerType })
    });
    return response.json();
  },

  updateStatus: async (kotId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/kot/${kotId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  }
};

export const orderAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/orders?${queryString}`);
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`);
    return response.json();
  },

  create: async (order) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    });
    return response.json();
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  reprintKOT: async (id, printerType = 'kitchen') => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/reprint-kot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ printerType })
    });
    return response.json();
  }
};

export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  }
};

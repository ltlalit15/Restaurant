const getApiConfig = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  try {
    const url = new URL(baseUrl);
    const credentials = url.username && url.password ? 
      btoa(`${url.username}:${url.password}`) : null;
    
    const cleanUrl = `${url.protocol}//${url.host}`;
    
    return {
      baseUrl: cleanUrl,
      headers: credentials ? {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    return {
      baseUrl: baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

const { baseUrl: API_BASE_URL, headers: DEFAULT_HEADERS } = getApiConfig();

export const printerAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/printers`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  add: async (printer) => {
    const response = await fetch(`${API_BASE_URL}/api/printers`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(printer)
    });
    return response.json();
  },

  update: async (id, printer) => {
    const response = await fetch(`${API_BASE_URL}/api/printers/${id}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(printer)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/printers/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  test: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/printers/${id}/test`, {
      method: 'POST',
      headers: DEFAULT_HEADERS
    });
    return response.json();
  }
};

export const kotAPI = {
  print: async (order, printerType = 'kitchen') => {
    const response = await fetch(`${API_BASE_URL}/api/kot/print`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ order, printerType })
    });
    return response.json();
  },

  getQueue: async () => {
    const response = await fetch(`${API_BASE_URL}/api/kot/queue`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  reprint: async (kotId, printerType = 'kitchen') => {
    const response = await fetch(`${API_BASE_URL}/api/kot/reprint/${kotId}`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ printerType })
    });
    return response.json();
  },

  updateStatus: async (kotId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/kot/${kotId}/status`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ status })
    });
    return response.json();
  }
};

export const orderAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/orders?${queryString}`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  create: async (order) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(order)
    });
    return response.json();
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  reprintKOT: async (id, printerType = 'kitchen') => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}/reprint-kot`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ printerType })
    });
    return response.json();
  }
};

export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  }
};

export const staffAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      headers: DEFAULT_HEADERS
    });
    return response.json();
  },

  add: async (staff) => {
    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(staff)
    });
    return response.json();
  },

  update: async (id, updates) => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS
    });
    return response.json();
  }
};

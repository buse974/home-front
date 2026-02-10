const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  },

  async getDevices(providerId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/devices/${providerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch devices');
    return response.json();
  },

  async executeCommand(providerId: string, deviceId: string, command: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/devices/${providerId}/${deviceId}/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command })
    });
    if (!response.ok) throw new Error('Failed to execute command');
    return response.json();
  },

  async getProviders() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/providers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch providers');
    return response.json();
  }
};

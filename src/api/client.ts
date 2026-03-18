import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach access token from memory on every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;

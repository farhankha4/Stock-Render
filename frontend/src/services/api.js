import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000
});

export const searchProducts = async (query) => {
  const response = await api.get('/search', { params: { q: query } });
  return response.data;
};

export const getProductDetails = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getTrackedProducts = async () => {
  const response = await api.get('/tracked');
  return response.data;
};

export const addTrackedProduct = async (productData) => {
  const response = await api.post('/tracked', productData);
  return response.data;
};

export const removeTrackedProduct = async (id) => {
  const response = await api.delete(`/tracked/${id}`);
  return response.data;
};

export const getProductHistory = async (id) => {
  const response = await api.get(`/tracked/${id}/history`);
  return response.data;
};

export const triggerScrapeRun = async (trackedProductId = null) => {
  const response = await api.post('/scrape/trigger', { tracked_product_id: trackedProductId });
  return response.data;
};

export const getAllLogs = async () => {
  const response = await api.get('/logs');
  return response.data;
};

export const getCsvExportUrl = () => {
  return `${API_BASE_URL}/export/csv`;
};

export default api;

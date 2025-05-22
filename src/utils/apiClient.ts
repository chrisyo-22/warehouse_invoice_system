// src/utils/apiClient.ts
import axios, { AxiosError } from 'axios';
import store from '../store';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api', // All API calls are relative to /api
});

// Axios request interceptor to add the auth token and common headers
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getters['auth/token'];
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Standardized error handler for Axios requests
const handleError = (error: AxiosError, defaultMessage: string): Error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const responseData = error.response.data as { message?: string };
    return new Error(responseData?.message || error.response.statusText || defaultMessage);
  } else if (error.request) {
    // The request was made but no response was received
    return new Error('Network error: No response received from server.');
  } else {
    // Something happened in setting up the request that triggered an Error
    return new Error(error.message || defaultMessage);
  }
};

// Function to fetch all orders
export async function fetchOrders() {
  try {
    const response = await apiClient.get('/orders');
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error fetching orders');
  }
}

// Function to fetch a single order by ID
export async function fetchOrderById(orderId: number) {
  try {
    const response = await apiClient.get(`/order/${orderId}`);
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error fetching order');
  }
}

// Function to create a new order
export async function createOrder(orderData: any) {
  try {
    const response = await apiClient.post('/order', orderData);
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error creating order');
  }
}

// Function to update an existing order
export async function updateOrder(orderId: number, updateData: any) {
  try {
    const response = await apiClient.put(`/order/${orderId}`, updateData);
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error updating order');
  }
}

// Function to delete an order
export async function deleteOrder(orderId: number) {
  try {
    const response = await apiClient.delete(`/order/${orderId}`);
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error deleting order');
  }
}

// Function to create an order from a text message
export async function createOrderFromMessage(text: string, recipient?: string) {
  try {
    const response = await apiClient.post('/order/parse', { text, recipient });
    return response.data;
  } catch (error) {
    // Log the original error for more details in development if needed
    console.error('Detailed error creating order from message:', error); 
    throw handleError(error as AxiosError, 'Failed to create order from message');
  }
}

// Function to fetch all categories
export async function fetchCategories() {
  try {
    const response = await apiClient.get('/categories');
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error fetching categories');
  }
}

// Function to fetch products, optionally by categoryId
export async function fetchProducts(categoryId?: number) {
  try {
    let url = '/products';
    if (typeof categoryId === 'number') {
      url += `?category_id=${categoryId}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError, 'Error fetching products');
  }
}
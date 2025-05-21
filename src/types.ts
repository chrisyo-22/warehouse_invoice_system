import type { Order, OrderItem } from '../api/types';

export interface Item {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit?: string | null;
} 
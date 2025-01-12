export interface Item {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit?: string | null;
}

export interface Order {
  id: string | number;
  date: string;
  recipient: string;
  owner: string;
  invoice_number: string;
  items: OrderItem[];
  created_at?: string;
  updated_at?: string;
  original_message?: string;
}

export interface OrderItem {
  id?: string | number;
  product_name: string;
  quantity: number;
  description?: string;
  unit_price?: number;
  unit?: string;
  subtotal?: number;
} 
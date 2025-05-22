export interface OrderItem {
  id?: number;
  order_id?: number;
  product_name: string;
  quantity: number;
  description?: string;
  unit_price?: number;
  unit?: string;
}

export interface Order {
  id: number;
  date: string;
  recipient: string;
  owner: string;
  invoice_number: string;
  status: string;
  items: OrderItem[];
  original_message?: string;
  created_at: string;
  updated_at: string;
} 
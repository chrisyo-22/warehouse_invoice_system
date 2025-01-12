import type { OrderItem } from '../../api/types';

export interface InvoiceData {
  owner: string;
  recipient: string;
  date: string;
  invoice_number: string;
  items: OrderItem[];
} 
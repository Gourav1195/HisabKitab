export interface Item {
  id: number;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  sell_price: number;
  buy_price?: number;
  quantity: number;
  low_stock_threshold: number;
  createdAt: number;
  updatedAt: number;
}

export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

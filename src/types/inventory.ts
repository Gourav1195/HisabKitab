export interface Item {
  id: number;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  sell_price: number;
  buy_price?: number;
  quantity?: number;
  quantity_left?: number;
  low_stock_threshold: number;
  created_at: number;
  updated_at: number;
  is_deleted: boolean;
} 

export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

export type SalesStackParamList = {
  SalesHistory: undefined;
  SaleDetails: {
    saleId: number;
    total: number;
    createdAt: number;
  };
  SellHome: undefined;
  CreditLedger: undefined;
};
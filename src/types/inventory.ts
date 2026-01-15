export interface Item {
  id: number;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  sell_price: number;        // required
  buy_price?:number;         // optional
  quantity: number;
  createdAt: number;
  updatedAt: number;
}

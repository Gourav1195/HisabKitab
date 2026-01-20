import { getDB } from '../db';

export interface LedgerEntry {
  customer_id: number;
  type: 'SALE' | 'PAYMENT';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  sale_id?: number;
  note?: string;
  created_at?: number;
}

export const addLedgerEntry = async (entry: LedgerEntry) => {
  try {
    const db = getDB();
    const now = Date.now();
    
    const result = db.execute(
      `INSERT INTO ledger 
       (customer_id, type, direction, amount, sale_id, note, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.customer_id,
        entry.type,
        entry.direction,
        entry.amount,
        entry.sale_id || null,
        entry.note || null,
        entry.created_at || now
      ]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Failed to add ledger entry:', error);
    throw error;
  }
};

export const recordSaleAsCredit = async (
  customerId: number, 
  saleId: number, 
  amount: number,
  note?: string
) => {
  return addLedgerEntry({
    customer_id: customerId,
    type: 'SALE',
    direction: 'DEBIT',
    amount: amount,
    sale_id: saleId,
    note: note || `Sale #${saleId}`,
    created_at: Date.now()
  });
};

export const recordPayment = async (
  customerId: number,
  amount: number,
  saleId?: number,
  note?: string
) => {
  return addLedgerEntry({
    customer_id: customerId,
    type: 'PAYMENT',
    direction: 'CREDIT',
    amount: amount,
    sale_id: saleId,
    note: note || 'Payment received',
    created_at: Date.now()
  });
};

export const getCustomerBalance = async (customerId: number): Promise<number> => {
  try {
    const db = getDB();
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0) as total_credit
      FROM ledger 
      WHERE customer_id = ?
    `;
    
    const result = db.execute(query, [customerId]);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows.item(0);
      return row.total_debit - row.total_credit;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting customer balance:', error);
    return 0;
  }
};

export const validatePayment = (
  customerId: number,
  paymentAmount: number,
  currentBalance: number
): { valid: boolean; message?: string } => {
  if (!customerId) {
    return { valid: false, message: 'Customer is required' };
  }
  
  if (paymentAmount <= 0) {
    return { valid: false, message: 'Payment amount must be greater than zero' };
  }
  
  if (paymentAmount > currentBalance) {
    return { 
      valid: false, 
      message: `Payment amount (₹${paymentAmount}) cannot exceed outstanding balance (₹${currentBalance})` 
    };
  }
  
  return { valid: true };
};
import { getDB } from '../db';

export const addPaymentEntry = (
  customerId: number,
  amount: number,
  note?: string
) => {
  const db = getDB();
  const now = Date.now();

  db.execute(
    `
    INSERT INTO ledger (
      customer_id,
      type,
      direction,
      amount,
      note,
      created_at
    ) VALUES (?, 'PAYMENT', 'CREDIT', ?, ?, ?)
  `,
    [customerId, amount, note ?? null, now]
  );
};

export const addReminderLog = (
  customerId: number,
  channel: 'SMS' | 'WHATSAPP',
  note?: string
) => {
  const db = getDB();
  const now = Date.now();

  // purely informational entry
  db.execute(
    `
    INSERT INTO ledger (
      customer_id,
      type,
      direction,
      amount,
      note,
      created_at
    ) VALUES (?, 'REMINDER', 'DEBIT', 0, ?, ?)
  `,
    [customerId, `[${channel}] ${note ?? 'Payment reminder sent'}`, now]
  );
};

export const updateCustomerPhone = (customerId: number, phone: string) => {
  const db = getDB();
  db.execute(
    `UPDATE customers SET phone = ? WHERE id = ?`,
    [phone, customerId]
  );
};

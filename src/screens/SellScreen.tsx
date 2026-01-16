import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getAllItems } from '../repo/inventoryRepo';
import { Item, CartItem } from '../types/inventory';
import { getDB } from '../db';
import { useFocusEffect } from '@react-navigation/native';

const SellScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [saleDone, setSaleDone] = useState(false);
  const [loading, setLoading] = useState(true);
  
useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  useEffect(() => {
  if (!saleDone) return;

  const t = setTimeout(() => {
    setSaleDone(false);
  }, 1200);

  return () => clearTimeout(t);
}, [saleDone]);


 const loadItems = () => {
    try {
      const data = getAllItems();
      setItems(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load items', err);
      setItems([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          price: item.sell_price,
          qty: existing ? existing.qty + 1 : 1,
        },
      };
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      next[id].qty += delta;
      if (next[id].qty <= 0) delete next[id];
      return next;
    });
  };

  const total = Object.values(cart)
    .reduce((sum, i) => sum + i.qty * i.price, 0);
const completeSale = () => {
  const db = getDB();
  const now = Date.now();

  const cartItems = Object.values(cart);
  if (cartItems.length === 0) return;

  const total = cartItems.reduce(
    (sum, i) => sum + i.qty * i.price,
    0
  );

  db.execute('BEGIN TRANSACTION');

  try {
    // 1. Insert sale
    const saleResult = db.execute(
      `INSERT INTO sales (created_at, total)
       VALUES (?, ?)`,
      [now, total]
    );

    const saleId = saleResult.insertId;

    // 2. Insert sale items + update cached stock
    cartItems.forEach(i => {
      // sale line
      db.execute(
        `INSERT INTO sale_items
         (sale_id, item_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [saleId, i.id, i.qty, i.price]
      );

      // cached stock update
      db.execute(
        `UPDATE items
         SET quantity_left = quantity_left - ?,
             updated_at = ?
         WHERE id = ?`,
        [i.qty, now, i.id]
      );
    });

    db.execute('COMMIT');

    setCart({});
    setSaleDone(true);
  } catch (e) {
    db.execute('ROLLBACK');
    console.error('Sale failed', e);
  }
};

 if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {saleDone && (
        <View style={styles.saleDone}>
          <Text style={styles.saleDoneText}>✓ Sale completed</Text>
        </View>
      )}

      <Text style={styles.header}>Sell</Text>

      <FlatList
        data={items}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => addToCart(item)}
          >
            <Text>{item.name}</Text>
            <Text>₹ {item.sell_price}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.cart}>
        <Text>Total: ₹ {total}</Text>
        {Object.values(cart).map(i => (
          <View key={i.id} style={styles.cartRow}>
            <Text>{i.name}</Text>
            <View style={styles.qty}>
              <Button title="−" onPress={() => updateQty(i.id, -1)} />
              <Text>{i.qty}</Text>
              <Button title="+" onPress={() => updateQty(i.id, 1)} />
            </View>
          </View>
        ))}
        <Button
          title="Complete Sale"
          disabled={total === 0}
          onPress={completeSale}
        />
      </View>
    </View>
  );
};

export default SellScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cart: { marginTop: 16 },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saleDone: {
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 6,
    marginBottom: 12,
  },
  saleDoneText: {
    color: '#155724',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect, useState, } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDB } from '../db';
import { Item } from '../types/inventory';

const ItemDetailsScreen = ({ route }: any) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);

  const loadItem = React.useCallback(() => {
    const db = getDB();
    const result = db.execute(
      `SELECT 
        id,
        name,
        barcode,
        sku,
        sell_price,
        buy_price,
        quantity,
        created_at as createdAt,
        updated_at as updatedAt
       FROM items
       WHERE id = ?`,
      [itemId]
    );

    const row = result.rows?._array?.[0];
    if (row) {
      setItem(row as Item);
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Loading item…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{item.name}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Quantity</Text>
        <Text style={styles.value}>{item.quantity}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Sell price</Text>
        <Text style={styles.value}>₹ {item.sell_price}</Text>
      </View>

      {item.buy_price != null && (
        <View style={styles.row}>
          <Text style={styles.label}>Buy price</Text>
          <Text style={styles.value}>₹ {item.buy_price}</Text>
        </View>
      )}

      {item.barcode && (
        <View style={styles.row}>
          <Text style={styles.label}>Barcode</Text>
          <Text style={styles.value}>{item.barcode}</Text>
        </View>
      )}

      {item.sku && (
        <View style={styles.row}>
          <Text style={styles.label}>SKU</Text>
          <Text style={styles.value}>{item.sku}</Text>
        </View>
      )}
    </View>
  );
};

export default ItemDetailsScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
});

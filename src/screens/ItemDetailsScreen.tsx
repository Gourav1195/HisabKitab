import React, { useEffect, useState, } from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';
import { getDB } from '../db';
import { Item } from '../types/inventory';

const ItemDetailsScreen = ({ route }: any) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [sellPrice, setSellPrice] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [threshold, setThreshold] = useState('');
  const [editingBuyPrice, setEditingBuyPrice] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState(false);
  const [editingSku, setEditingSku] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');


  useEffect(() => {
    if (item) {
      setSellPrice(item.sell_price?.toString() ?? '');
      setBuyPrice(item.buy_price?.toString() ?? '');
      setBarcode(item.barcode ?? '');
      setSku(item.sku ?? '');
      setThreshold(item.low_stock_threshold?.toString() ?? '0');
    }
  }, [item]);

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
        low_stock_threshold,
        created_at as createdAt,
        updated_at as updatedAt
       FROM items
       WHERE id = ? and is_deleted = 0`,
      [itemId]
    );

    const row = result.rows?._array?.[0];
    if (row) {
      setItem(row as Item);
    }
  }, [itemId]);

  const adjustQty = (delta: number) => {
    const db = getDB();
    db.execute(
      `UPDATE items SET quantity = quantity + ?, updated_at = ? WHERE id = ?`,
      [delta, Date.now(), itemId]
    );
    loadItem();
  };

  useEffect(() => {
    loadItem();
  }, [loadItem]);


  return (
    <View style={styles.container}>
      {!item ? (
        <View style={styles.center}>
          <Text>Loading item…</Text>
        </View>
      ) : (
        <>
          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Quantity</Text>

            <View style={styles.qtyControls}>
              <Button title="−" onPress={() => adjustQty(-1)} />
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <Button title="+" onPress={() => adjustQty(1)} />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Sell price</Text>

            {editingPrice ? (
              <TextInput
                value={sellPrice}
                keyboardType="numeric"
                onChangeText={setSellPrice}
                onBlur={() => {
                  const price = Number(sellPrice);
                  if (!isNaN(price)) {
                    const db = getDB();
                    db.execute(
                      `UPDATE items SET sell_price = ?, updated_at = ? WHERE id = ?`,
                      [price, Date.now(), itemId]
                    );
                    loadItem();
                  }
                  setEditingPrice(false);
                }}
                style={styles.input}
                autoFocus
              />
            ) : (
              <Text
                style={styles.value}
                onPress={() => setEditingPrice(true)}
              >
                ₹ {item.sell_price}
              </Text>
            )}
          </View>

          <View style={styles.row}>
            <Text
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide advanced ▲' : 'Show advanced ▼'}
            </Text>
          </View>
          {showAdvanced && (
            <View>
              <View style={styles.row}>
                <Text style={styles.label}>Low stock alert at</Text>

                <TextInput
                  value={threshold}
                  keyboardType="numeric"
                  onChangeText={setThreshold}
                  onBlur={() => {
                    const value = Number(threshold);
                    if (!isNaN(value)) {
                      const db = getDB();
                      db.execute(
                        `UPDATE items
               SET low_stock_threshold = ?, updated_at = ?
               WHERE id = ?`,
                        [value, Date.now(), itemId]
                      );
                      loadItem();
                    }
                  }}
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Buy price</Text>

                {editingBuyPrice ? (
                  <TextInput
                    value={buyPrice}
                    keyboardType="numeric"
                    onChangeText={setBuyPrice}
                    onBlur={() => {
                      const value = buyPrice === '' ? null : Number(buyPrice);
                      if (value === null || !isNaN(value)) {
                        const db = getDB();
                        db.execute(
                          `UPDATE items SET buy_price = ?, updated_at = ? WHERE id = ?`,
                          [value, Date.now(), itemId]
                        );
                        loadItem();
                      }
                      setEditingBuyPrice(false);
                    }}
                    style={styles.input}
                    
                  />
                ) : (
                  <Text
                    style={styles.value}
                    onPress={() => setEditingBuyPrice(true)}
                  >
                    {item.buy_price != null ? `₹ ${item.buy_price}` : '—'}
                  </Text>
                )}
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Barcode</Text>
                {editingBarcode ? (
                  <TextInput
                    value={barcode}
                    onChangeText={setBarcode}
                    onBlur={() => {
                      const db = getDB();
                      db.execute(
                        `UPDATE items SET barcode = ?, updated_at = ? WHERE id = ?`,
                        [barcode.trim() || null, Date.now(), itemId]
                      );
                      loadItem();
                      setEditingBarcode(false);
                    }}
                    style={styles.input}
                    
                  />
                ) : (
                  <Text
                    style={styles.value}
                    onPress={() => setEditingBarcode(true)}
                  >
                    {item.barcode || '—'}
                  </Text>
                )}
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>SKU</Text>

                {editingSku ? (
                  <TextInput
                    value={sku}
                    onChangeText={setSku}
                    onBlur={() => {
                      const db = getDB();
                      db.execute(
                        `UPDATE items SET sku = ?, updated_at = ? WHERE id = ?`,
                        [sku.trim() || null, Date.now(), itemId]
                      );
                      loadItem();
                      setEditingSku(false);
                    }}
                    style={styles.input}
                    
                  />
                ) : (
                  <Text
                    style={styles.value}
                    onPress={() => setEditingSku(true)}
                  >
                    {item.sku || '—'}
                  </Text>
                )}
              </View>
            </View>
          )}
        </>)}
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
  qty: {
    fontSize: 18,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,

  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyValue: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    minWidth: 80,
    textAlign: 'right',
    fontSize: 16,
  },
  advancedToggle: {
    fontSize: 14,
    color: '#007aff',
  },


});

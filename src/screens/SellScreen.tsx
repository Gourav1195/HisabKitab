import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getAllItems } from '../repo/inventoryRepo';
import { Item, CartItem } from '../types/inventory';
import { getDB } from '../db';
import { useFocusEffect } from '@react-navigation/native';
import PricePrompt from '../components/Sales/PricePrompt';
import SearchBar from '../components/Sales/SearchBar';
import ItemList from '../components/Sales/ItemList';
import CartBar from '../components/Sales/CartBar';
import CreditToggle from '../components/Sales/CreditToggle';
import CustomerSelector from '../components/Sales/CustomerSelector';
import { Colors, Spacing, BorderRadius } from '../theme/Colors';

interface Customer {
  id: number;
  name: string;
  phone: string;
}

const SellScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [saleDone, setSaleDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cartHeight, setCartHeight] = useState(0);
  const [isCredit, setIsCredit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [pricePrompt, setPricePrompt] = useState<{
    visible: boolean;
    mode: 'existing' | 'new';
    item: Item | null;
    price: string;
  }>({
    visible: false,
    mode: 'existing',
    item: null,
    price: ''
  });

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  useEffect(() => {
    if (!saleDone) return;
    const t = setTimeout(() => setSaleDone(false), 1200);
    return () => clearTimeout(t);
  }, [saleDone]);

  // Reset customer when credit is turned off
  useEffect(() => {
    if (!isCredit) {
      setSelectedCustomer(null);
    }
  }, [isCredit]);

  const loadItems = () => {
    try {
      const data = getAllItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addItemToCart = (item: Item, price: number) => {
    setCart(prev => {
      const existing = prev[item.id];
      
      if (item.quantity_left && item.quantity_left > 0) {
        const newQty = existing ? existing.qty + 1 : 1;
        if (newQty > item.quantity_left) {
          Alert.alert(`Only ${item.quantity_left} in stock`);
          return prev;
        }
      }
      
      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          price,
          qty: existing ? existing.qty + 1 : 1,
        },
      };
    });
  };

  const handleAddItem = (item: Item) => {
    if (item.sell_price > 0) {
      addItemToCart(item, item.sell_price);
      return;
    }

    setPricePrompt({
      visible: true,
      mode: 'existing',
      item,
      price: ''
    });
  };

  const handleQuickAdd = () => {
    if (!query.trim()) return;

    setPricePrompt({
      visible: true,
      mode: 'new',
      item: {
        id: -1,
        name: query.trim(),
        sell_price: 0,
        quantity: 0,
        quantity_left: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
        low_stock_threshold: 0,
        is_deleted: false,
      },
      price: ''
    });
  };

  const handlePriceConfirm = (price: number) => {
    if (!pricePrompt.item) return;

    if (pricePrompt.mode === 'existing') {
      addItemToCart(pricePrompt.item, price);
      
      try {
        const db = getDB();
        const now = Date.now();
        db.execute(
          `UPDATE items SET sell_price = ?, updated_at = ? WHERE id = ?`,
          [price, now, pricePrompt.item.id]
        );
        loadItems();
      } catch (error) {
        console.error('Failed to update price:', error);
      }
    } else {
      const db = getDB();
      const now = Date.now();

      try {
        const res = db.execute(
          `INSERT INTO items 
           (name, sell_price, quantity, quantity_left, created_at, updated_at, low_stock_threshold)
           VALUES (?, ?, 0, 0, ?, ?, 0)`,
          [pricePrompt.item.name, price, now, now]
        );

        const itemId = Number(res.insertId);

        setCart(prev => ({
          ...prev,
          [itemId]: {
            id: itemId,
            name: pricePrompt.item!.name,
            price,
            qty: 1,
          },
        }));

        setQuery('');
        loadItems();
      } catch (error) {
        Alert.alert('Failed to add item', error instanceof Error ? error.message : String(error));
      }
    }

    setPricePrompt({ visible: false, mode: 'existing', item: null, price: '' });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id]) {
        next[id].qty += delta;
        if (next[id].qty <= 0) {
          delete next[id];
        }
      }
      return next;
    });
  };

  const handleEditPrice = (cartItem: CartItem) => {
    const item = items.find(it => it.id === cartItem.id);
    if (item) {
      setPricePrompt({
        visible: true,
        mode: 'existing',
        item: { ...item, sell_price: cartItem.price },
        price: String(cartItem.price)
      });
    }
  };

  const insertLedgerEntry = (saleId: number, amount: number) => {
    if (!selectedCustomer) return;
    
    const db = getDB();
    const now = Date.now();
    
    // For credit sale, insert DEBIT entry (customer owes money)
    // For payment (future feature), would insert CREDIT entry (customer paid)
    db.execute(
      `INSERT INTO ledger 
       (customer_id, type, direction, amount, sale_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        selectedCustomer.id,
        'SALE',
        'DEBIT',  // Increases customer's balance (what they owe)
        amount,
        saleId,
        now
      ]
    );
  };

  const completeSale = () => {
    // Validation for credit sales
    if (isCredit && !selectedCustomer) {
      Alert.alert('Customer Required', 'Please select a customer for credit sale');
      return;
    }

    const db = getDB();
    const now = Date.now();
    const cartItems = Object.values(cart);
    
    if (cartItems.length === 0) return;

    db.execute('BEGIN TRANSACTION');

    try {
      // Insert sale with credit flag
      const saleResult = db.execute(
        `INSERT INTO sales (created_at, total, is_credit, customer_id) VALUES (?, ?, ?, ?)`,
        [now, total, isCredit ? 1 : 0, selectedCustomer?.id || null]
      );

      const saleId = saleResult.insertId;

      // Insert sale items + update stock
      cartItems.forEach(i => {
        db.execute(
          `INSERT INTO sale_items (sale_id, item_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [saleId, i.id, i.qty, i.price]
        );

        const item = items.find(it => it.id === i.id);
        if (item && item.quantity_left !== null) {
          db.execute(
            `UPDATE items
             SET quantity_left = quantity_left - ?,
                 updated_at = ?
             WHERE id = ?`,
            [i.qty, now, i.id]
          );
        }
      });

      // Insert ledger entry for credit sales
      if (isCredit && selectedCustomer && saleId) {
        insertLedgerEntry(saleId, total);
      }

      db.execute('COMMIT');
      
      // Show success message
      setSaleDone(true);
      
      // Clear cart
      setCart({});
      
      // Reset customer selection if credit sale
      if (isCredit) {
        setSelectedCustomer(null);
      }
      
      // Refresh items
      loadItems();
      
    } catch (e) {
      db.execute('ROLLBACK');
      Alert.alert(
        'Sale failed', 
        e instanceof Error ? e.message : String(e)
      );
    }
  };

  const clearCart = () => {
    if (Object.keys(cart).length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setCart({})
        }
      ]
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter(i =>
      i.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  const SHOW_ALPHA_INDEX = filteredItems.length >= 50;
  const total = Object.values(cart)
    .reduce((sum, i) => sum + i.qty * i.price, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      isCredit ? styles.creditBackground : styles.saleBackground
    ]}>
      {saleDone && (
        <View style={[
          styles.saleDone,
          isCredit ? styles.creditSaleDone : styles.cashSaleDone
        ]}>
          <Text style={styles.saleDoneText}>
            ✓ {isCredit ? 'Credit Sale' : 'Cash Sale'} completed
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerText}>Sell</Text>
        <TouchableOpacity onPress={clearCart} disabled={Object.keys(cart).length === 0}>
          <Text style={[
            styles.clearCartText,
            Object.keys(cart).length === 0 && styles.clearCartDisabled
          ]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      <CreditToggle
        isCredit={isCredit}
        onToggle={() => setIsCredit(!isCredit)}
        customerName={selectedCustomer?.name}
      />

      {isCredit && (
        <View style={styles.customerSection}>
          <CustomerSelector
            selectedCustomerId={selectedCustomer?.id}
            onSelectCustomer={setSelectedCustomer}
          />
        </View>
      )}

      <SearchBar
        query={query}
        onChangeText={setQuery}
        onQuickAdd={handleQuickAdd}
        showQuickAdd={filteredItems.length === 0 && query.trim() !== ''}
      />

      {filteredItems.length > 0 && (
        <ItemList
          items={filteredItems}
          onAddItem={handleAddItem}
          showAlphaIndex={SHOW_ALPHA_INDEX}
          cartHeight={cartHeight}
        />
      )}

      <PricePrompt
        visible={pricePrompt.visible}
        mode={pricePrompt.mode}
        item={pricePrompt.item}
        price={pricePrompt.price}
        onChange={price => setPricePrompt(p => ({ ...p, price }))}
        onCancel={() => setPricePrompt({ visible: false, mode: 'existing', item: null, price: '' })}
        onConfirm={handlePriceConfirm}
      />

      <CartBar
        cart={cart}
        total={total}
        onUpdateQty={updateQty}
        onEditPrice={handleEditPrice}
        onCompleteSale={completeSale}
        onLayout={setCartHeight}
        isCredit={isCredit}
        customerName={selectedCustomer?.name}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  saleBackground: {
    backgroundColor: '#F9FAFB', // Light background for cash sales
  },
  creditBackground: {
    backgroundColor: '#FFF5F5', // Light red background for credit sales
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  saleDone: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  cashSaleDone: {
    backgroundColor: '#E8F5E9', // Light green for cash
  },
  creditSaleDone: {
    backgroundColor: '#FFEBEE', // Light red for credit
  },
  saleDoneText: {
    color: Colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 20,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  clearCartText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  clearCartDisabled: {
    color: Colors.textLight,
    opacity: 0.5,
  },
  customerSection: {
    marginBottom: Spacing.md,

  },
});

export default SellScreen;
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getAllItems } from '../repo/inventoryRepo';
import { Item, CartItem } from '../types/inventory';
import { getDB } from '../db';
import PricePrompt from '../components/Sales/PricePrompt';
import SearchBar from '../components/Sales/SearchBar';
import ItemList from '../components/Sales/ItemList';
import CartBar from '../components/Sales/CartBar';
import CreditToggle from '../components/Sales/CreditToggle';
import CustomerSelector from '../components/Sales/CustomerSelector';
import { Colors, Spacing, Typography, BorderRadius, getScaledFontSize, Shadow } from '../theme/Colors';
import { useUISettings } from '../ui/UISettingsContext';

interface Customer { id: number; name: string; phone: string; }

type PricePromptState = { visible: boolean; mode: 'existing' | 'new'; item: Item | null; price: string; };
const EMPTY_PROMPT: PricePromptState = { visible: false, mode: 'existing', item: null, price: '' };

const SaleDoneToast = ({ visible, isCredit, fontScale }: { visible: boolean; isCredit: boolean; fontScale: number }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity]);
  if (!visible) return null;
  const scaledSm = getScaledFontSize(Typography.fontSize.sm, fontScale);
  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor: isCredit ? Colors.stockLow : Colors.success }]}>
      <MaterialCommunityIcons name="check-circle" size={18 * fontScale} color={Colors.textInverse} />
      <Text style={[styles.toastText, { fontSize: scaledSm }]}>{isCredit ? 'Credit sale recorded' : 'Sale completed'}</Text>
    </Animated.View>
  );
};

const SellScreen = () => {
  const { fontScale } = useUISettings();
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [saleDone, setSaleDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cartHeight, setCartHeight] = useState(0);
  const [isCredit, setIsCredit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pricePrompt, setPricePrompt] = useState<PricePromptState>(EMPTY_PROMPT);

  const loadItems = useCallback(() => {
    try { setItems(getAllItems()); } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  useEffect(() => { if (!isCredit) setSelectedCustomer(null); }, [isCredit]);

  const addItemToCart = useCallback((item: Item, price: number) => {
    setCart(prev => ({ ...prev, [item.id]: { id: item.id, name: item.name, price, qty: (prev[item.id]?.qty ?? 0) + 1 } }));
  }, []);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id]) { next[id] = { ...next[id], qty: next[id].qty + delta }; if (next[id].qty <= 0) delete next[id]; }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    if (Object.keys(cart).length === 0) return;
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setCart({}) },
    ]);
  }, [cart]);

  const handleAddItem = useCallback((item: Item) => {
    if (item.sell_price > 0) { addItemToCart(item, item.sell_price); return; }
    setPricePrompt({ visible: true, mode: 'existing', item, price: '' });
  }, [addItemToCart]);

  const handleQuickAdd = useCallback(() => {
    if (!query.trim()) return;
    setPricePrompt({ visible: true, mode: 'new', item: { id: -1, name: query.trim(), sell_price: 0, quantity: 0, quantity_left: 0, created_at: Date.now(), updated_at: Date.now(), low_stock_threshold: 0, is_deleted: false }, price: '' });
  }, [query]);

  const handleEditPrice = useCallback((cartItem: CartItem) => {
    const item = items.find(it => it.id === cartItem.id);
    if (item) { setPricePrompt({ visible: true, mode: 'existing', item: { ...item, sell_price: cartItem.price }, price: String(cartItem.price) }); }
  }, [items]);

  const handlePriceConfirm = useCallback((price: number) => {
    if (!pricePrompt.item) return;
    if (pricePrompt.mode === 'existing') {
      addItemToCart(pricePrompt.item, price);
      try { getDB().execute('UPDATE items SET sell_price = ?, updated_at = ? WHERE id = ?', [price, Date.now(), pricePrompt.item.id]); loadItems(); } catch { }
    } else {
      try {
        const db = getDB(); const now = Date.now();
        const res = db.execute(`INSERT INTO items (name, sell_price, quantity, quantity_left, created_at, updated_at, low_stock_threshold) VALUES (?, ?, 0, 0, ?, ?, 0)`, [pricePrompt.item.name, price, now, now]);
        const itemId = Number(res.insertId);
        setCart(prev => ({ ...prev, [itemId]: { id: itemId, name: pricePrompt.item!.name, price, qty: 1 } }));
        setQuery(''); loadItems();
      } catch (e) { Alert.alert('Failed to add item', e instanceof Error ? e.message : String(e)); }
    }
    setPricePrompt(EMPTY_PROMPT);
  }, [pricePrompt, addItemToCart, loadItems]);

  const total = useMemo(() => Object.values(cart).reduce((sum, i) => sum + i.qty * i.price, 0), [cart]);

  const completeSale = useCallback(() => {
    if (isCredit && !selectedCustomer) { Alert.alert('Customer Required', 'Please select a customer for a credit sale'); return; }
    const db = getDB(); const now = Date.now(); const cartItems = Object.values(cart);
    if (cartItems.length === 0) return;
    try {
      db.execute('BEGIN TRANSACTION');
      const saleResult = db.execute('INSERT INTO sales (created_at, total, is_credit, customer_id) VALUES (?, ?, ?, ?)', [now, total, isCredit ? 1 : 0, selectedCustomer?.id ?? null]);
      const saleId = saleResult.insertId;
      cartItems.forEach(i => {
        db.execute('INSERT INTO sale_items (sale_id, item_id, quantity, price) VALUES (?, ?, ?, ?)', [saleId, i.id, i.qty, i.price]);
        const inv = items.find(it => it.id === i.id);
        if (inv && inv.quantity_left != null) { db.execute('UPDATE items SET quantity_left = quantity_left - ?, updated_at = ? WHERE id = ?', [i.qty, now, i.id]); }
      });
      if (isCredit && selectedCustomer && saleId) { db.execute('INSERT INTO ledger (customer_id, type, direction, amount, sale_id, created_at) VALUES (?, ?, ?, ?, ?, ?)', [selectedCustomer.id, 'SALE', 'DEBIT', total, saleId, now]); }
      db.execute('COMMIT');
      setSaleDone(true); setTimeout(() => setSaleDone(false), 1500); setCart({}); if (isCredit) setSelectedCustomer(null); loadItems();
    } catch (e) { db.execute('ROLLBACK'); Alert.alert('Sale failed', e instanceof Error ? e.message : String(e)); }
  }, [cart, isCredit, selectedCustomer, total, items, loadItems]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q) || i.barcode?.toLowerCase().includes(q));
  }, [items, query]);

  const cartCount = Object.keys(cart).length;
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="cart-outline" size={48 * fontScale} color={Colors.textLight} />
        <Text style={[styles.loadingText, { fontSize: scaledMd }]}>Loading items…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SaleDoneToast visible={saleDone} isCredit={isCredit} fontScale={fontScale} />
      
      <View style={styles.topBar}>
        <CreditToggle isCredit={isCredit} onToggle={() => setIsCredit(v => !v)} customerName={selectedCustomer?.name} />
      </View>

      {isCredit && (
        <View style={styles.customerSection}>
          <CustomerSelector selectedCustomerId={selectedCustomer?.id} onSelectCustomer={setSelectedCustomer} />
        </View>
      )}

      <SearchBar query={query} onChangeText={setQuery} onQuickAdd={handleQuickAdd} showQuickAdd={filteredItems.length === 0 && query.trim() !== ''} />

      <View style={styles.listWrapper}>
        <ItemList items={filteredItems} onAddItem={handleAddItem} showAlphaIndex={filteredItems.length >= 50} cartHeight={cartHeight} />
      </View>

      <PricePrompt visible={pricePrompt.visible} mode={pricePrompt.mode} item={pricePrompt.item} price={pricePrompt.price} onChange={price => setPricePrompt(p => ({ ...p, price }))} onCancel={() => setPricePrompt(EMPTY_PROMPT)} onConfirm={handlePriceConfirm} />

      <CartBar cart={cart} total={total} onUpdateQty={updateQty} onEditPrice={handleEditPrice} onCompleteSale={completeSale} onClearCart={clearCart} onLayout={setCartHeight} isCredit={isCredit} customerName={selectedCustomer?.name} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.lg },
  loadingText: { color: Colors.textLight, fontWeight: Typography.fontWeight.medium },
  toast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, borderRadius: BorderRadius.lg, ...Shadow.sm },
  toastText: { color: Colors.textInverse, fontWeight: Typography.fontWeight.semibold },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  customerSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  listWrapper: { flex: 1 },
});

export default SellScreen;
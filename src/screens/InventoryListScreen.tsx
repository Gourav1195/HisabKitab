import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Switch,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllItems } from '../repo/inventoryRepo';
import { Item } from '../types/inventory';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Colors,
  getScaledFontSize,
  Spacing,
  Typography,
  BorderRadius,
  Shadow,
} from '../theme/Colors';
import AddItemForm from '../components/Inventory/AddItem';
import { SettingsButton } from '../components/Buttons/SettingsButton';
import { useUISettings } from '../ui/UISettingsContext';
import { getDB } from '../db';

/* ─────────────────────────────────────────────────────────────────────────
   Types & Constants
───────────────────────────────────────────────────────────────────────── */

type FilterStatus = 'ALL' | 'LOW' | 'OUT';
type SortBy = 'NAME' | 'PRICE' | 'STOCK' | 'RECENT';

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'All Items' },
  { key: 'LOW', label: '⚠ Low Stock' },
  { key: 'OUT', label: '✕ Out of Stock' },
];

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'NAME', label: 'Name' },
  { key: 'PRICE', label: 'Price' },
  { key: 'STOCK', label: 'Stock' },
  { key: 'RECENT', label: 'Recent' },
];

/* ─────────────────────────────────────────────────────────────────────────
   Pure helper
───────────────────────────────────────────────────────────────────────── */

const getStockStatus = (
  item: Item,
): { color: string; badge: 'LOW' | 'OUT' | null } => {
  const qty = Number(item.quantity_left);
  const threshold = Number(item.low_stock_threshold);

  if (Number.isNaN(qty)) return { color: Colors.stockOk, badge: null };
  if (qty === 0) return { color: Colors.stockOut, badge: 'OUT' };
  if (!Number.isNaN(threshold) && threshold > 0 && qty <= threshold) {
    return { color: Colors.stockLow, badge: 'LOW' };
  }
  return { color: Colors.stockOk, badge: null };
};

/* ─────────────────────────────────────────────────────────────────────────
   Main Screen
───────────────────────────────────────────────────────────────────────── */

const InventoryListScreen = ({ navigation }: any) => {
  const { fontScale } = useUISettings();

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters / sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('NAME');
  const [showAlphaIndex, setShowAlphaIndex] = useState(false);

  // Context menu
  const [contextItem, setContextItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  /* ── Data ──────────────────────────────────────────────────────────── */

  const loadItems = useCallback(async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      const data = getAllItems();
      setItems(data);
    } catch {
      Alert.alert('Error', 'Failed to load inventory');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  /* ── Header ────────────────────────────────────────────────────────── */

  const HeaderRight = useCallback(() => <SettingsButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: HeaderRight });
  }, [navigation, HeaderRight]);

  /* ── Derived data ──────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const low = items.filter(i => {
      const qty = Number(i.quantity_left);
      const thresh = Number(i.low_stock_threshold);
      return qty > 0 && thresh > 0 && qty <= thresh;
    }).length;
    const out = items.filter(i => Number(i.quantity_left) === 0).length;
    return { total: items.length, low, out };
  }, [items]);

  const processedItems = useMemo(() => {
    let result = [...items];

    // Search — also matches SKU and barcode
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.sku?.toLowerCase().includes(q) ||
          i.barcode?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (filterStatus === 'LOW') {
      result = result.filter(i => {
        const qty = Number(i.quantity_left);
        const thresh = Number(i.low_stock_threshold);
        return qty > 0 && thresh > 0 && qty <= thresh;
      });
    } else if (filterStatus === 'OUT') {
      result = result.filter(i => Number(i.quantity_left) === 0);
    }

    // Sort (alpha index always forces NAME)
    const activeSort = showAlphaIndex ? 'NAME' : sortBy;
    switch (activeSort) {
      case 'NAME':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'PRICE':
        result.sort((a, b) => (b.sell_price ?? 0) - (a.sell_price ?? 0));
        break;
      case 'STOCK':
        result.sort(
          (a, b) =>
            (Number(a.quantity_left) ?? 0) - (Number(b.quantity_left) ?? 0),
        );
        break;
      case 'RECENT':
        result.sort((a, b) => b.updated_at - a.updated_at);
        break;
    }

    return result;
  }, [items, searchQuery, filterStatus, sortBy, showAlphaIndex]);

  const groupedSections = useMemo(() => {
    if (!showAlphaIndex) return [];
    const map: Record<string, Item[]> = {};
    processedItems.forEach(item => {
      const ch = item.name.charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(ch) ? ch : '#';
      if (!map[letter]) map[letter] = [];
      map[letter].push(item);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, sectionItems]) => ({ letter, sectionItems }));
  }, [processedItems, showAlphaIndex]);

  /* ── Context menu actions ──────────────────────────────────────────── */

  const closeContextMenu = useCallback(() => setContextItem(null), []);

  const handleEditName = useCallback(() => {
    if (!contextItem) return;
    setEditingItem(contextItem);
    setEditNameValue(contextItem.name);
    setContextItem(null);
  }, [contextItem]);

  const saveEditName = useCallback(() => {
    if (!editingItem || !editNameValue.trim()) return;
    getDB().execute('UPDATE items SET name = ?, updated_at = ? WHERE id = ?', [
      editNameValue.trim(),
      Date.now(),
      editingItem.id,
    ]);
    setEditingItem(null);
    loadItems();
  }, [editingItem, editNameValue, loadItems]);

  const handleArchive = useCallback(() => {
    if (!contextItem) return;
    const item = contextItem;
    setContextItem(null);
    Alert.alert(
      'Archive Item',
      `Archive "${item.name}"? It will be hidden from inventory but data is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            getDB().execute(
              'UPDATE items SET is_deleted = 1, updated_at = ? WHERE id = ?',
              [Date.now(), item.id],
            );
            loadItems();
          },
        },
      ],
    );
  }, [contextItem, loadItems]);

  const handleDelete = useCallback(() => {
    if (!contextItem) return;
    const item = contextItem;
    setContextItem(null);
    Alert.alert(
      'Delete Permanently',
      `Delete "${item.name}"? All stock history will also be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const db = getDB();
            db.execute('DELETE FROM stock_movements WHERE item_id = ?', [
              item.id,
            ]);
            db.execute('DELETE FROM items WHERE id = ?', [item.id]);
            loadItems();
          },
        },
      ],
    );
  }, [contextItem, loadItems]);

  /* ── Row renderer ──────────────────────────────────────────────────── */

  const renderItemRow = useCallback(
    ({ item }: { item: Item }) => {
      const status = getStockStatus(item);
      const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
      const scaledSm = Typography.fontSize.sm * fontScale;

      return (
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
          onLongPress={() => setContextItem(item)}
          activeOpacity={0.65}
          delayLongPress={280}
        >
          <View style={styles.itemLeft}>
            <Text
              style={[styles.itemName, { fontSize: scaledMd }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.sku ? (
              <Text
                style={[styles.itemSku, { fontSize: scaledSm - 1 }]}
                numberOfLines={1}
              >
                SKU: {item.sku}
              </Text>
            ) : null}
          </View>

          <View style={styles.itemRight}>
            <View style={styles.itemMeta}>
              <Text style={[styles.itemPrice, { fontSize: scaledMd }]}>
                ₹{item.sell_price ?? 0}
              </Text>
              <Text
                style={[
                  styles.itemQty,
                  { color: status.color, fontSize: scaledSm },
                ]}
              >
                {item.quantity_left ?? 0} left
              </Text>
            </View>
            {status.badge ? (
              <View
                style={[
                  styles.badge,
                  status.badge === 'LOW' ? styles.badgeLow : styles.badgeOut,
                ]}
              >
                <Text style={[styles.badgeText, { color: status.color }]}>
                  {status.badge}
                </Text>
              </View>
            ) : (
              <View style={styles.badgePlaceholder} />
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={Colors.textLight}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [fontScale, navigation],
  );

  const renderSection = useCallback(
    ({ item }: { item: { letter: string; sectionItems: Item[] } }) => (
      <View>
        <Text
          style={[
            styles.sectionLetter,
            { fontSize: Typography.fontSize.xs * fontScale },
          ]}
        >
          {item.letter}
        </Text>
        {item.sectionItems.map(i => renderItemRow({ item: i }))}
      </View>
    ),
    [renderItemRow, fontScale],
  );

  /* ── Loading ───────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons
          name="package-variant"
          size={40}
          color={Colors.textLight}
        />
        <Text style={styles.loadingText}>Loading inventory…</Text>
      </View>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  const scaledSm = Typography.fontSize.sm * fontScale;
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);

  return (
    <View style={styles.container}>
      {/* ── Add Item ──────────────────────────────────────────────── */}
      <AddItemForm onItemAdded={loadItems} />

      {/* ── Summary Bar ───────────────────────────────────────────── */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCard}>
          <Text
            style={[
              styles.summaryNum,
              { fontSize: Typography.fontSize.xxl * fontScale },
            ]}
          >
            {stats.total}
          </Text>
          <Text
            style={[
              styles.summaryLbl,
              { fontSize: Typography.fontSize.xs * fontScale },
            ]}
          >
            TOTAL
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => setFilterStatus(f => (f === 'LOW' ? 'ALL' : 'LOW'))}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.summaryNum,
              styles.summaryNumLow,
              { fontSize: Typography.fontSize.xxl * fontScale },
            ]}
          >
            {stats.low}
          </Text>
          <Text
            style={[
              styles.summaryLbl,
              styles.summaryLblLow,
              { fontSize: Typography.fontSize.xs * fontScale },
            ]}
          >
            LOW
          </Text>
        </TouchableOpacity>
        <View style={styles.summaryDivider} />
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => setFilterStatus(f => (f === 'OUT' ? 'ALL' : 'OUT'))}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.summaryNum,
              styles.summaryNumOut,
              { fontSize: Typography.fontSize.xxl * fontScale },
            ]}
          >
            {stats.out}
          </Text>
          <Text
            style={[
              styles.summaryLbl,
              styles.summaryLblOut,
              { fontSize: Typography.fontSize.xs * fontScale },
            ]}
          >
            OUT
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={Colors.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search name, SKU, barcode…"
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { fontSize: scaledMd }]}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* ── Filter Chips ──────────────────────────────────────────── */}
      <View style={styles.filterPanel}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsList}
          style={styles.filterChipsScroll}
        >
          {FILTER_OPTIONS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filterStatus === f.key && styles.chipActive]}
              onPress={() => setFilterStatus(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontSize: scaledSm },
                  filterStatus === f.key && styles.chipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { fontSize: scaledSm - 1 }]}>
            Sort:
          </Text>
          {SORT_OPTIONS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.sortChip,
                sortBy === s.key && !showAlphaIndex && styles.sortChipActive,
              ]}
              onPress={() => {
                setSortBy(s.key);
                if (showAlphaIndex) setShowAlphaIndex(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { fontSize: scaledSm - 1 },
                  sortBy === s.key &&
                    !showAlphaIndex &&
                    styles.sortChipTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── List Header ───────────────────────────────────────────── */}
      <View style={styles.listHeader}>
        <Text style={[styles.listCount, { fontSize: scaledSm }]}>
          {processedItems.length === items.length
            ? `${items.length} items`
            : `${processedItems.length} of ${items.length} items`}
        </Text>
        <TouchableOpacity
          style={styles.alphaToggle}
          onPress={() => setShowAlphaIndex(v => !v)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.alphaLabel,
              { fontSize: scaledSm },
              showAlphaIndex && styles.alphaLabelActive,
            ]}
          >
            A–Z Index
          </Text>
          <Switch
            value={showAlphaIndex}
            onValueChange={setShowAlphaIndex}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.surface}
            style={styles.alphaSwitch}
          />
        </TouchableOpacity>
      </View>

      {/* ── Empty State ───────────────────────────────────────────── */}
      {processedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={searchQuery ? 'magnify-close' : 'package-variant-closed'}
            size={44 * fontScale}
            color={Colors.textLight}
          />
          <Text
            style={[
              styles.emptyTitle,
              { fontSize: Typography.fontSize.lg * fontScale },
            ]}
          >
            {searchQuery
              ? 'No items match'
              : filterStatus !== 'ALL'
              ? 'None here'
              : 'No items yet'}
          </Text>
          <Text style={[styles.emptySub, { fontSize: scaledMd }]}>
            {searchQuery
              ? 'Try a different search term'
              : filterStatus !== 'ALL'
              ? 'Try changing the filter above'
              : 'Add items using the form above'}
          </Text>
        </View>
      ) : showAlphaIndex ? (
        <FlatList
          data={groupedSections}
          keyExtractor={({ letter }) => `sec-${letter}`}
          renderItem={renderSection}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={processedItems}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItemRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ── Context Menu Modal ────────────────────────────────────── */}
      <Modal
        visible={contextItem !== null}
        transparent
        animationType="slide"
        onRequestClose={closeContextMenu}
      >
        <Pressable style={styles.overlay} onPress={closeContextMenu}>
          <Pressable style={styles.contextSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.contextItemName} numberOfLines={1}>
              {contextItem?.name}
            </Text>

            <Text style={styles.contextHint}>Hold to manage this item</Text>

            <TouchableOpacity
              style={styles.contextOption}
              onPress={handleEditName}
              activeOpacity={0.7}
            >
              <View style={[styles.contextIconWrap, styles.contextIconEdit]}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.contextOptionText}>Edit Name</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={Colors.textLight}
                style={styles.contextChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contextOption}
              onPress={handleArchive}
              activeOpacity={0.7}
            >
              <View style={[styles.contextIconWrap, styles.contextIconArchive]}>
                <MaterialCommunityIcons
                  name="archive-arrow-down-outline"
                  size={18}
                  color={Colors.stockLow}
                />
              </View>
              <Text
                style={[styles.contextOptionText, styles.contextOptionWarn]}
              >
                Archive Item
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={Colors.textLight}
                style={styles.contextChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contextOption}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <View style={[styles.contextIconWrap, styles.contextIconDelete]}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={Colors.error}
                />
              </View>
              <Text
                style={[styles.contextOptionText, styles.contextOptionDanger]}
              >
                Delete Permanently
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={Colors.textLight}
                style={styles.contextChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contextCancelBtn}
              onPress={closeContextMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.contextCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Edit Name Modal ───────────────────────────────────────── */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setEditingItem(null)}>
          <Pressable style={styles.editSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.editTitle}>Edit Item Name</Text>

            <TextInput
              value={editNameValue}
              onChangeText={setEditNameValue}
              style={[styles.editInput, { fontSize: scaledMd }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveEditName}
              maxLength={50}
              selectTextOnFocus
              placeholder="Item name"
              placeholderTextColor={Colors.textLight}
            />

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnCancel]}
                onPress={() => setEditingItem(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.editBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editBtn,
                  styles.editBtnSave,
                  !editNameValue.trim() && styles.editBtnDisabled,
                ]}
                onPress={saveEditName}
                disabled={!editNameValue.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.editBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* ── Layout ─────────────────────────────────────────────────────── */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.lg,
  },

  /* ── Header actions ─────────────────────────────────────────────── */

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  headerBtnSmall: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  headerBtnLarge: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  /* ── Summary bar ────────────────────────────────────────────────── */

  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },

  summaryNum: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  summaryNumLow: {
    color: Colors.stockLow,
  },

  summaryNumOut: {
    color: Colors.stockOut,
  },

  summaryLbl: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.8,
    marginTop: 3,
  },

  summaryLblLow: {
    color: Colors.stockLow,
  },

  summaryLblOut: {
    color: Colors.stockOut,
  },

  /* ── Search ─────────────────────────────────────────────────────── */

  searchRow: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 42,
  },

  searchIcon: {
    marginRight: Spacing.md,
  },

  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    height: 42,
  },

  /* ── Filter + Sort panel ────────────────────────────────────────── */

  filterPanel: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  filterChipsScroll: {
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  filterChipsList: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },

  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },

  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },

  chipText: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  chipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },

  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },

  sortLabel: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.xs,
  },

  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.md,
  },

  sortChipActive: {
    backgroundColor: Colors.secondary,
  },

  sortChipText: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.medium,
  },

  sortChipTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },

  /* ── List header ────────────────────────────────────────────────── */

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },

  listCount: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.medium,
  },

  alphaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  alphaLabel: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  alphaLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },

  alphaSwitch: {
    transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
  },

  /* ── Item row ───────────────────────────────────────────────────── */

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  itemLeft: {
    flex: 1,
    marginRight: Spacing.xl,
  },

  itemName: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 0.1,
  },

  itemSku: {
    color: Colors.textLight,
    marginTop: 2,
  },

  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  itemMeta: {
    alignItems: 'flex-end',
  },

  itemPrice: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  itemQty: {
    fontWeight: Typography.fontWeight.medium,
    marginTop: 2,
  },

  badge: {
    paddingHorizontal: Spacing.sm + 1,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },

  badgeLow: {
    backgroundColor: Colors.stockLow + '22',
  },

  badgeOut: {
    backgroundColor: Colors.stockOut + '22',
  },

  badgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.6,
  },

  badgePlaceholder: {
    width: 34,
  },

  /* ── Section (A–Z) ──────────────────────────────────────────────── */

  sectionLetter: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  /* ── Empty state ────────────────────────────────────────────────── */

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },

  emptyTitle: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },

  emptySub: {
    color: Colors.textLight,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── List ───────────────────────────────────────────────────────── */

  listContent: {
    paddingBottom: Spacing.xxl,
  },

  /* ── Modal overlay ──────────────────────────────────────────────── */

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'flex-end',
  },

  /* ── Context menu sheet ─────────────────────────────────────────── */

  contextSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl + 8,
    borderTopRightRadius: BorderRadius.xl + 8,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 16,
    ...Shadow.md,
  },

  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },

  contextItemName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  contextHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
  },

  contextOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.lg,
  },

  contextIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contextIconEdit: {
    backgroundColor: Colors.primaryLighter,
  },

  contextIconArchive: {
    backgroundColor: Colors.stockLow + '18',
  },

  contextIconDelete: {
    backgroundColor: Colors.error + '18',
  },

  contextOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  contextOptionWarn: {
    color: Colors.stockLow,
  },

  contextOptionDanger: {
    color: Colors.error,
  },

  contextChevron: {
    marginLeft: 'auto',
  },

  contextCancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.sm,
  },

  contextCancelText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  /* ── Edit name sheet ────────────────────────────────────────────── */

  editSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl + 8,
    borderTopRightRadius: BorderRadius.xl + 8,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 16,
    ...Shadow.md,
  },

  editTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },

  editInput: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: Spacing.xl,
  },

  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  editBtnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  editBtnSave: {
    backgroundColor: Colors.primary,
  },

  editBtnDisabled: {
    opacity: 0.45,
  },

  editBtnCancelText: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    fontSize: Typography.fontSize.md,
  },

  editBtnSaveText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.md,
  },
});

export default InventoryListScreen;

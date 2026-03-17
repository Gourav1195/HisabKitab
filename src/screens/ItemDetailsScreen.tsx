import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDB } from '../db';
import { Item } from '../types/inventory';
import {
  adjustItemQty,
  getAllItems,
  getRecentStockHistory,
} from '../repo/inventoryRepo';
import { formatDateTime } from '../utils/formatDateTime';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadow,
} from '../theme/Colors';

/* ─────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────── */

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValue}>{children}</View>
  </View>
);

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

/* ─────────────────────────────────────────────────────────────────────────
   Inline editable field
───────────────────────────────────────────────────────────────────────── */

const EditableValue = ({
  value,
  display,
  editing,
  onStartEdit,
  onChangeText,
  onSave,
  keyboardType = 'default',
  prefix,
  placeholder = '—',
}: {
  value: string;
  display?: string;
  editing: boolean;
  onStartEdit: () => void;
  onChangeText: (t: string) => void;
  onSave: () => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  prefix?: string;
  placeholder?: string;
}) => {
  if (editing) {
    return (
      <View style={styles.editingRow}>
        {prefix ? <Text style={styles.editPrefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onSave}
          onSubmitEditing={onSave}
          style={styles.inlineInput}
          keyboardType={keyboardType}
          autoFocus
          returnKeyType="done"
          selectTextOnFocus
        />
        <TouchableOpacity
          onPress={onSave}
          style={styles.saveChip}
          activeOpacity={0.75}
        >
          <Text style={styles.saveChipText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onStartEdit}
      activeOpacity={0.6}
      style={styles.displayValueRow}
    >
      <Text style={styles.displayValue}>
        {display ?? (value || placeholder)}
      </Text>
      <MaterialCommunityIcons
        name="pencil-outline"
        size={14}
        color={Colors.textLight}
        style={styles.editIcon}
      />
    </TouchableOpacity>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Stock adjust row
───────────────────────────────────────────────────────────────────────── */

const StockAdjustRow = ({
  label,
  icon,
  iconColor,
  placeholder,
  onSubmit,
}: {
  label: string;
  icon: string;
  iconColor: string;
  placeholder: string;
  onSubmit: (val: number) => void;
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const val = Number(text);
    if (val > 0) {
      onSubmit(val);
      setText('');
    }
  };

  return (
    <View style={styles.adjustRow}>
      <View
        style={[styles.adjustIconWrap, { backgroundColor: iconColor + '18' }]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.adjustLabel}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType="numeric"
        style={styles.adjustInput}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[
          styles.adjustBtn,
          { backgroundColor: iconColor },
          !text.trim() && styles.adjustBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!text.trim()}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="check"
          size={16}
          color={Colors.textInverse}
        />
      </TouchableOpacity>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Main Screen
───────────────────────────────────────────────────────────────────────── */

const ItemDetailsScreen = ({ route, navigation }: any) => {
  const { itemId } = route.params;

  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Editing states
  const [editingSellPrice, setEditingSellPrice] = useState(false);
  const [editingBuyPrice, setEditingBuyPrice] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState(false);
  const [editingSku, setEditingSku] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(false);

  // Field values
  const [sellPrice, setSellPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [threshold, setThreshold] = useState('');

  /* ── Load ─────────────────────────────────────────────────────────── */

  const loadItem = useCallback(() => {
    const all = getAllItems();
    const found = all.find(i => i.id === itemId) ?? null;
    setItem(found);
    if (found) {
      setSellPrice(found.sell_price?.toString() ?? '');
      setBuyPrice(found.buy_price?.toString() ?? '');
      setBarcode(found.barcode ?? '');
      setSku(found.sku ?? '');
      setThreshold(found.low_stock_threshold?.toString() ?? '0');
      setHistory(getRecentStockHistory(itemId, 8));
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  /* ── Header ───────────────────────────────────────────────────────── */

  useLayoutEffect(() => {
    if (item) {
      navigation.setOptions({ title: item.name });
    }
  }, [navigation, item]);

  /* ── DB save helpers ──────────────────────────────────────────────── */

  const saveField = (field: string, value: string | number | null) => {
    getDB().execute(
      `UPDATE items SET ${field} = ?, updated_at = ? WHERE id = ?`,
      [value, Date.now(), itemId],
    );
    loadItem();
  };

  const handleSaveSellPrice = () => {
    const val = parseFloat(sellPrice);
    if (!isNaN(val) && val >= 0) saveField('sell_price', val);
    setEditingSellPrice(false);
  };

  const handleSaveBuyPrice = () => {
    const val = buyPrice === '' ? null : parseFloat(buyPrice);
    if (val === null || !isNaN(val)) saveField('buy_price', val);
    setEditingBuyPrice(false);
  };

  const handleSaveBarcode = () => {
    saveField('barcode', barcode.trim() || null);
    setEditingBarcode(false);
  };

  const handleSaveSku = () => {
    saveField('sku', sku.trim() || null);
    setEditingSku(false);
  };

  const handleSaveThreshold = () => {
    const val = Number(threshold);
    if (!isNaN(val)) saveField('low_stock_threshold', val);
    setEditingThreshold(false);
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Item',
      `Archive "${item?.name}"? It will be hidden from inventory but all data is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            getDB().execute(
              'UPDATE items SET is_deleted = 1, updated_at = ? WHERE id = ?',
              [Date.now(), itemId],
            );
            navigation.goBack();
          },
        },
      ],
    );
  };

  /* ── Stock status ─────────────────────────────────────────────────── */

  const getStockColor = () => {
    if (!item) return Colors.textLight;
    const qty = Number(item.quantity_left);
    const thresh = Number(item.low_stock_threshold);
    if (qty === 0) return Colors.stockOut;
    if (thresh > 0 && qty <= thresh) return Colors.stockLow;
    return Colors.stockOk;
  };

  const getStockLabel = () => {
    if (!item) return '';
    const qty = Number(item.quantity_left);
    const thresh = Number(item.low_stock_threshold);
    if (qty === 0) return 'Out of stock';
    if (thresh > 0 && qty <= thresh) return 'Low stock';
    return 'In stock';
  };

  /* ── Render ───────────────────────────────────────────────────────── */

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons
          name="package-variant"
          size={40}
          color={Colors.textLight}
        />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const stockColor = getStockColor();
  const margin =
    item.buy_price != null && item.sell_price != null
      ? item.sell_price - item.buy_price
      : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Hero card ───────────────────────────────────────────────── */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroName}>{item.name}</Text>
          <View
            style={[styles.stockPill, { backgroundColor: stockColor + '20' }]}
          >
            <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockPillText, { color: stockColor }]}>
              {getStockLabel()}
            </Text>
          </View>
        </View>
        <View style={styles.heroRight}>
          <Text style={styles.heroPrice}>₹{item.sell_price ?? 0}</Text>
          <Text style={styles.heroPriceSub}>sell price</Text>
        </View>
      </View>

      {/* ── Stock numbers ───────────────────────────────────────────── */}
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: stockColor }]}>
            {item.quantity_left ?? 0}
          </Text>
          <Text style={styles.statLbl}>Available</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{item.quantity ?? 0}</Text>
          <Text style={styles.statLbl}>Total Added</Text>
        </View>
        {margin !== null && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statNum,
                  { color: margin >= 0 ? Colors.success : Colors.error },
                ]}
              >
                ₹{margin.toFixed(0)}
              </Text>
              <Text style={styles.statLbl}>Margin</Text>
            </View>
          </>
        )}
      </View>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <SectionTitle title="Pricing" />
      <View style={styles.card}>
        <InfoRow label="Sell Price">
          <EditableValue
            value={sellPrice}
            display={`₹ ${item.sell_price ?? 0}`}
            editing={editingSellPrice}
            onStartEdit={() => setEditingSellPrice(true)}
            onChangeText={setSellPrice}
            onSave={handleSaveSellPrice}
            keyboardType="decimal-pad"
            prefix="₹"
          />
        </InfoRow>
        <InfoRow label="Buy Price">
          <EditableValue
            value={buyPrice}
            display={item.buy_price != null ? `₹ ${item.buy_price}` : undefined}
            editing={editingBuyPrice}
            onStartEdit={() => setEditingBuyPrice(true)}
            onChangeText={setBuyPrice}
            onSave={handleSaveBuyPrice}
            keyboardType="decimal-pad"
            prefix="₹"
            placeholder="Tap to set"
          />
        </InfoRow>
      </View>

      {/* ── Stock management ────────────────────────────────────────── */}
      <SectionTitle title="Stock Management" />
      <View style={styles.card}>
        <StockAdjustRow
          label="Restock"
          icon="plus-circle-outline"
          iconColor={Colors.success}
          placeholder="units to add"
          onSubmit={val => {
            adjustItemQty(itemId, val, 'RESTOCK');
            loadItem();
          }}
        />
        <View style={styles.adjustDivider} />
        <StockAdjustRow
          label="Remove"
          icon="minus-circle-outline"
          iconColor={Colors.stockLow}
          placeholder="units to remove"
          onSubmit={val => {
            adjustItemQty(itemId, val, 'SALE');
            loadItem();
          }}
        />
      </View>

      {/* ── Recent activity ─────────────────────────────────────────── */}
      <SectionTitle title="Recent Activity" />
      <View style={styles.card}>
        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <MaterialCommunityIcons
              name="history"
              size={28}
              color={Colors.textLight}
            />
            <Text style={styles.emptyHistoryText}>No stock movements yet</Text>
          </View>
        ) : (
          history.map((h, idx) => {
            const isRestock = h.action === 'RESTOCK';
            return (
              <View
                key={h.id}
                style={[
                  styles.historyItem,
                  idx < history.length - 1 && styles.historyItemBorder,
                ]}
              >
                <View
                  style={[
                    styles.historyDot,
                    {
                      backgroundColor:
                        (isRestock ? Colors.success : Colors.stockLow) + '20',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isRestock ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={isRestock ? Colors.success : Colors.stockLow}
                  />
                </View>
                <View style={styles.historyBody}>
                  <Text style={styles.historyAction}>
                    {isRestock
                      ? 'Restocked'
                      : h.action === 'SALE'
                      ? 'Removed / Sold'
                      : h.action}
                  </Text>
                  <Text style={styles.historyTime}>
                    {formatDateTime(h.created_at)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyQty,
                    { color: isRestock ? Colors.success : Colors.stockLow },
                  ]}
                >
                  {isRestock ? '+' : '−'}
                  {h.quantity}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* ── Advanced ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Text>
        <MaterialCommunityIcons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {showAdvanced && (
        <>
          <View style={styles.card}>
            <InfoRow label="Low Stock Alert">
              <EditableValue
                value={threshold}
                display={`≤ ${item.low_stock_threshold ?? 0} units`}
                editing={editingThreshold}
                onStartEdit={() => setEditingThreshold(true)}
                onChangeText={setThreshold}
                onSave={handleSaveThreshold}
                keyboardType="numeric"
                placeholder="0"
              />
            </InfoRow>
            <InfoRow label="Barcode">
              <EditableValue
                value={barcode}
                display={item.barcode || undefined}
                editing={editingBarcode}
                onStartEdit={() => setEditingBarcode(true)}
                onChangeText={setBarcode}
                onSave={handleSaveBarcode}
                placeholder="Tap to set"
              />
            </InfoRow>
            <InfoRow label="SKU">
              <EditableValue
                value={sku}
                display={item.sku || undefined}
                editing={editingSku}
                onStartEdit={() => setEditingSku(true)}
                onChangeText={setSku}
                onSave={handleSaveSku}
                placeholder="Tap to set"
              />
            </InfoRow>
          </View>

          {/* ── Danger zone ─────────────────────────────────────── */}
          <SectionTitle title="Danger Zone" />
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleArchive}
              activeOpacity={0.7}
            >
              <View style={styles.dangerIconWrap}>
                <MaterialCommunityIcons
                  name="archive-arrow-down-outline"
                  size={18}
                  color={Colors.stockLow}
                />
              </View>
              <View style={styles.dangerText}>
                <Text style={styles.dangerTitle}>Archive Item</Text>
                <Text style={styles.dangerSub}>
                  Hide from inventory, data is kept
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={Colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },

  loadingText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.md,
  },

  /* ── Hero card ────────────────────────────────────────────────────── */

  heroCard: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },

  heroLeft: {
    flex: 1,
    marginRight: Spacing.xl,
  },

  heroName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.lg,
  },

  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },

  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  stockPillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },

  heroRight: {
    alignItems: 'flex-end',
  },

  heroPrice: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },

  heroPriceSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textInverse,
    opacity: 0.6,
    marginTop: 2,
  },

  /* ── Stat row ─────────────────────────────────────────────────────── */

  statRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },

  statNum: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  statLbl: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.6,
    marginTop: 3,
  },

  /* ── Section title ────────────────────────────────────────────────── */

  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textLight,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.xl,
    textTransform: 'uppercase',
  },

  /* ── Card ─────────────────────────────────────────────────────────── */

  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadow.sm,
  },

  /* ── Info row ─────────────────────────────────────────────────────── */

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  infoLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  infoValue: {
    flex: 1.5,
    alignItems: 'flex-end',
  },

  /* ── Editable value ───────────────────────────────────────────────── */

  displayValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  displayValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  editIcon: {
    opacity: 0.6,
  },

  editingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  editPrefix: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  inlineInput: {
    borderBottomWidth: 1.5,
    borderColor: Colors.primary,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    minWidth: 80,
    textAlign: 'right',
    paddingVertical: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },

  saveChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.md,
  },

  saveChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },

  /* ── Stock adjust ─────────────────────────────────────────────────── */

  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },

  adjustDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.xl,
  },

  adjustIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  adjustLabel: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  adjustInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    minWidth: 90,
    textAlign: 'right',
    backgroundColor: Colors.background,
  },

  adjustBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  adjustBtnDisabled: {
    opacity: 0.4,
  },

  /* ── History ──────────────────────────────────────────────────────── */

  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },

  emptyHistoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textLight,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },

  historyItemBorder: {
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  historyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  historyBody: {
    flex: 1,
  },

  historyAction: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },

  historyTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },

  historyQty: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },

  /* ── Advanced toggle ──────────────────────────────────────────────── */

  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    marginTop: Spacing.md,
  },

  advancedToggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  /* ── Danger zone ──────────────────────────────────────────────────── */

  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },

  dangerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.stockLow + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dangerText: {
    flex: 1,
  },

  dangerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.stockLow,
  },

  dangerSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },

  bottomSpacer: {
    height: Spacing.xxl,
  },
});

export default ItemDetailsScreen;

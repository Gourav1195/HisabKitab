import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  // TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getSaleItems } from '../../repo/salesRepo';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadow,
  getScaledFontSize,
} from '../../theme/Colors';
import { useUISettings } from '../../ui/UISettingsContext';
import { formatDateTime } from '../../utils/formatDateTime';

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */

type SaleItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  returned_qty?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
   Main Screen
───────────────────────────────────────────────────────────────────────── */

const SaleDetailsScreen = ({ route, navigation }: any) => {
  const { saleId, total, createdAt, isCredit, customerName } = route.params;
  const { fontScale } = useUISettings();
  const [items, setItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    setItems(getSaleItems(saleId));
  }, [saleId]);

  const scaledXs  = Typography.fontSize.xs * fontScale;
  const scaledSm  = Typography.fontSize.sm * fontScale;
  const scaledMd  = getScaledFontSize(Typography.fontSize.md, fontScale);
  const scaledXxl = getScaledFontSize(Typography.fontSize.xxl, fontScale);
  const scaledXxxl = getScaledFontSize(Typography.fontSize.xxxl, fontScale);

  const subtotal = items.reduce(
    (sum, i) => sum + i.price * (i.quantity - (i.returned_qty ?? 0)),
    0,
  );

  return (
    <View style={styles.screen}>
      {/* ── Hero header ─────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={[styles.heroAmount, { fontSize: scaledXxxl }]}>
            ₹{total}
          </Text>
          <Text style={[styles.heroDate, { fontSize: scaledXs }]}>
            {formatDateTime(createdAt)}
          </Text>
          {isCredit && customerName ? (
            <View style={styles.creditPill}>
              <MaterialCommunityIcons
                name="account-clock-outline"
                size={12}
                color={Colors.stockLow}
              />
              <Text style={[styles.creditPillText, { fontSize: scaledXs }]}>
                Credit · {customerName}
              </Text>
            </View>
          ) : (
            <View style={styles.cashPill}>
              <MaterialCommunityIcons
                name="cash"
                size={12}
                color={Colors.success}
              />
              <Text style={[styles.cashPillText, { fontSize: scaledXs }]}>
                Cash sale
              </Text>
            </View>
          )}
        </View>
        <View style={styles.heroRight}>
          <Text style={[styles.itemCountNum, { fontSize: scaledXxl }]}>
            {items.length}
          </Text>
          <Text style={[styles.itemCountLbl, { fontSize: scaledXs }]}>
            ITEMS
          </Text>
        </View>
      </View>

      {/* ── Items list ──────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { fontSize: scaledXs }]}>
        ITEMS SOLD
      </Text>

      <FlatList
        data={items}
        keyExtractor={i => i.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { fontSize: scaledMd }]}>
              No items found
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const effectiveQty = item.quantity - (item.returned_qty ?? 0);
          const lineTotal = item.price * effectiveQty;
          const isReturned = (item.returned_qty ?? 0) > 0;
          const isLast = index === items.length - 1;

          return (
            <View style={[styles.itemRow, isLast && styles.itemRowLast]}>
              {/* Name + returned badge */}
              <View style={styles.itemLeft}>
                <Text
                  style={[styles.itemName, { fontSize: scaledMd }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.itemCalc, { fontSize: scaledXs }]}>
                  {effectiveQty} × ₹{item.price}
                  {isReturned ? (
                    <Text style={styles.returnedNote}>
                      {' '}({item.returned_qty} returned)
                    </Text>
                  ) : null}
                </Text>
              </View>

              {/* Line total */}
              <Text
                style={[
                  styles.itemTotal,
                  { fontSize: scaledSm },
                  isReturned && styles.itemTotalReturned,
                ]}
              >
                ₹{lineTotal.toFixed(0)}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { fontSize: scaledSm }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { fontSize: scaledMd }]}>
                ₹{subtotal.toFixed(0)}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
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

  /* ── Hero ─────────────────────────────────────────────────────────── */

  hero: {
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

  heroAmount: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },

  heroDate: {
    color: Colors.textInverse,
    opacity: 0.6,
    marginBottom: Spacing.lg,
  },

  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.stockLow + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.xl,
  },

  creditPillText: {
    color: Colors.stockLow,
    fontWeight: Typography.fontWeight.bold,
  },

  cashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.success + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.xl,
  },

  cashPillText: {
    color: Colors.success,
    fontWeight: Typography.fontWeight.bold,
  },

  heroRight: {
    alignItems: 'flex-end',
  },

  itemCountNum: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },

  itemCountLbl: {
    color: Colors.textInverse,
    opacity: 0.55,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.8,
    marginTop: 2,
  },

  /* ── Section title ────────────────────────────────────────────────── */

  sectionTitle: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  /* ── Item rows ────────────────────────────────────────────────────── */

  listContent: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadow.sm,
    paddingBottom: 0,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.lg,
  },

  itemRowLast: {
    borderBottomWidth: 0,
  },

  itemLeft: {
    flex: 1,
  },

  itemName: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 3,
  },

  itemCalc: {
    color: Colors.textLight,
  },

  returnedNote: {
    color: Colors.stockOut,
    fontStyle: 'italic',
  },

  itemTotal: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  itemTotalReturned: {
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },

  /* ── Footer total ─────────────────────────────────────────────────── */

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingBottom: Spacing.xl,
  },

  totalLabel: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  totalValue: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  /* ── Empty ────────────────────────────────────────────────────────── */

  emptyWrap: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },

  emptyText: {
    color: Colors.textLight,
  },

});

export default SaleDetailsScreen;
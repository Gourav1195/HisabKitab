import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getSales, Sale } from '../../repo/salesRepo';
import { SalesStackParamList } from '../../types/inventory';
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
   Helpers
───────────────────────────────────────────────────────────────────────── */

/** Group sales by calendar date label, e.g. "Today", "Yesterday", "12 Jan" */
type GroupedSection = { dateLabel: string; data: Sale[] };

const getDateLabel = (ts: number): string => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

const groupSalesByDate = (sales: Sale[]): GroupedSection[] => {
  const map = new Map<string, Sale[]>();
  for (const sale of sales) {
    const label = getDateLabel(sale.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(sale);
  }
  return Array.from(map.entries()).map(([dateLabel, data]) => ({
    dateLabel,
    data,
  }));
};

/** Summarise item names from a sale — expects Sale to carry items array */
const getItemSummary = (sale: Sale): string => {
  if (!sale.items || sale.items.length === 0) return 'No items';
  const names = sale.items.map(i => i.name);
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2} more`;
};

/* ─────────────────────────────────────────────────────────────────────────
   Sale Row
───────────────────────────────────────────────────────────────────────── */

type SaleRowProps = {
  sale: Sale;
  onPress: () => void;
  fontScale: number;
  isLast: boolean;
};

const SaleRow = ({ sale, onPress, fontScale, isLast }: SaleRowProps) => {
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  const scaledSm = Typography.fontSize.sm * fontScale;
  const scaledXs = Typography.fontSize.xs * fontScale;

  return (
    <TouchableOpacity
      style={[styles.saleRow, isLast && styles.saleRowLast]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      {/* Left: item summary + timestamp */}
      <View style={styles.saleLeft}>
        <Text
          style={[styles.saleItems, { fontSize: scaledMd }]}
          numberOfLines={1}
        >
          {getItemSummary(sale)}
        </Text>
        <View style={styles.saleMeta}>
          <Text style={[styles.saleTime, { fontSize: scaledXs }]}>
            {new Date(sale.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {sale.isCredit ? (
            <View style={styles.creditBadge}>
              <Text
                style={[styles.creditBadgeText, { fontSize: scaledXs - 1 }]}
              >
                CREDIT
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right: total + chevron */}
      <View style={styles.saleRight}>
        <Text style={[styles.saleTotal, { fontSize: scaledMd }]}>
          ₹{sale.total}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={14}
          color={Colors.textLight}
        />
      </View>
    </TouchableOpacity>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Section Header (date group)
───────────────────────────────────────────────────────────────────────── */

const SectionHeader = ({
  label,
  totalForDay,
  fontScale,
}: {
  label: string;
  totalForDay: number;
  fontScale: number;
}) => (
  <View style={styles.sectionHeader}>
    <Text
      style={[
        styles.sectionLabel,
        { fontSize: Typography.fontSize.xs * fontScale },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.sectionTotal,
        { fontSize: Typography.fontSize.xs * fontScale },
      ]}
    >
      ₹{totalForDay}
    </Text>
  </View>
);

/* ─────────────────────────────────────────────────────────────────────────
   Main Screen
───────────────────────────────────────────────────────────────────────── */

const SalesHistoryScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<SalesStackParamList>>();
  const { fontScale } = useUISettings();

  const [sales, setSales] = useState<Sale[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = getSales();
    setSales(data);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const grouped = groupSalesByDate(sales);

  const scaledXxl = getScaledFontSize(Typography.fontSize.xxl, fontScale);
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  const scaledXs = Typography.fontSize.xs * fontScale;

  /* ── Empty ────────────────────────────────────────────────────────── */
  if (sales.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="receipt"
          size={44}
          color={Colors.textLight}
        />
        <Text style={[styles.emptyTitle, { fontSize: scaledMd }]}>
          No sales yet
        </Text>
        <Text style={[styles.emptySub, { fontSize: scaledXs }]}>
          Completed sales will appear here
        </Text>
      </View>
    );
  }

  /* ── Flat list data: interleave section headers and rows ──────────── */
  type ListItem =
    | { type: 'header'; label: string; total: number; key: string }
    | { type: 'row'; sale: Sale; isLast: boolean; key: string };

  const listData: ListItem[] = [];
  for (const section of grouped) {
    const dayTotal = section.data.reduce((sum, s) => sum + s.total, 0);
    listData.push({
      type: 'header',
      label: section.dateLabel,
      total: dayTotal,
      key: `h-${section.dateLabel}`,
    });
    section.data.forEach((sale, idx) => {
      listData.push({
        type: 'row',
        sale,
        isLast: idx === section.data.length - 1,
        key: `r-${sale.id}`,
      });
    });
  }

  return (
    <View style={styles.container}>
      {/* ── Summary strip ─────────────────────────────────────────── */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { fontSize: scaledXxl }]}>
            {sales.length}
          </Text>
          <Text style={[styles.summaryLbl, { fontSize: scaledXs }]}>
            TOTAL SALES
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { fontSize: scaledXxl }]}>
            ₹{sales.reduce((s, x) => s + x.total, 0)}
          </Text>
          <Text style={[styles.summaryLbl, { fontSize: scaledXs }]}>
            ALL TIME
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text
            style={[
              styles.summaryNum,
              styles.summaryNumCredit,
              { fontSize: scaledXxl },
            ]}
          >
            {sales.filter(s => s?.isCredit).length}
          </Text>
          <Text style={[styles.summaryLbl, { fontSize: scaledXs }]}>
            CREDIT
          </Text>
        </View>
      </View>

      {/* ── List ──────────────────────────────────────────────────── */}
      <FlatList
        data={listData}
        keyExtractor={item => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <SectionHeader
                label={item.label}
                totalForDay={item.total}
                fontScale={fontScale}
              />
            );
          }
          return (
            <SaleRow
              sale={item.sale}
              isLast={item.isLast}
              fontScale={fontScale}
              onPress={() =>
                navigation.navigate('SaleDetails', {
                  saleId: item.sale.id,
                  total: item.sale.total,
                  createdAt: item.sale.createdAt,
                })
              }
            />
          );
        }}
      />
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ── Summary strip ──────────────────────────────────────────────── */

  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  summaryItem: {
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

  summaryNumCredit: {
    color: Colors.stockLow,
  },

  summaryLbl: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.8,
    marginTop: 3,
  },

  /* ── Section header ─────────────────────────────────────────────── */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },

  sectionLabel: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  sectionTotal: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },

  /* ── Sale row ───────────────────────────────────────────────────── */

  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  saleRowLast: {
    borderBottomWidth: 0,
    marginBottom: Spacing.sm,
  },

  saleLeft: {
    flex: 1,
    marginRight: Spacing.xl,
  },

  saleItems: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 3,
  },

  saleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  saleTime: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.medium,
  },

  creditBadge: {
    backgroundColor: Colors.stockLow + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },

  creditBadgeText: {
    color: Colors.stockLow,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  saleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  saleTotal: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  /* ── Empty ──────────────────────────────────────────────────────── */

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },

  emptyTitle: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.md,
  },

  emptySub: {
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* ── List ───────────────────────────────────────────────────────── */

  listContent: {
    paddingBottom: Spacing.xxl,
  },
});

export default SalesHistoryScreen;

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Colors, Spacing, Typography, BorderRadius, Shadow, getScaledFontSize,
} from '../theme/Colors';
import { useUISettings } from '../ui/UISettingsContext';
import {
  getBigThree, getSalesTrend, getCashVsCredit,
  getInventoryAlerts, getTopSellers, getCreditToCollect,
  TimeRange,
} from '../repo/dashboardRepo';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - Spacing.xl * 2;

/* ═══════════════════════════════════════════════════════════════
   HELPER: Format numbers
   ═══════════════════════════════════════════════════════════════ */
const fmt = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `${(n / 1000).toFixed(0)}K`
  : n.toString();

/* ═══════════════════════════════════════════════════════════════
   TIME RANGE TOGGLE BUTTON
   ═══════════════════════════════════════════════════════════════ */
interface TimeRangeToggleProps {
  selected: TimeRange;
  onChange: (r: TimeRange) => void;
  fontScale: number;
}

const TimeRangeToggle: React.FC<TimeRangeToggleProps> = ({ selected, onChange, fontScale }) => {
  const options: { value: TimeRange; label: string; icon: string }[] = [
    { value: 'today', label: 'Today', icon: 'clock-outline' },
    { value: 'week', label: '7 Days', icon: 'calendar-week' },
    { value: 'month', label: 'Month', icon: 'calendar-month' },
  ];

  return (
    <View style={styles.toggleContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.toggleBtn,
            selected === opt.value && styles.toggleBtnActive,
          ]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={opt.icon}
            size={14 * fontScale}
            color={selected === opt.value ? Colors.textInverse : Colors.textSecondary}
          />
          <Text
            style={[
              styles.toggleBtnText,
              { fontSize: Typography.fontSize.xs * fontScale },
              selected === opt.value && styles.toggleBtnTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HERO CARD (The Big 3)
   ═══════════════════════════════════════════════════════════════ */
interface HeroCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  subText?: string;
  fontScale: number;
  onPress?: () => void;
}

const HeroCard: React.FC<HeroCardProps> = ({ label, value, icon, color, subText, fontScale, onPress }) => (
  <TouchableOpacity
    style={[styles.heroCard, { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.heroIconWrap}>
      <MaterialCommunityIcons name={icon} size={22 * fontScale} color={Colors.textInverse} />
    </View>
    <Text style={[styles.heroValue, { fontSize: getScaledFontSize(26, fontScale) }]}>
      ₹{value}
    </Text>
    <Text style={[styles.heroLabel, { fontSize: Typography.fontSize.xs * fontScale }]}>
      {label}
    </Text>
    {subText && (
      <Text style={[styles.heroSub, { fontSize: Typography.fontSize.xs * fontScale }]}>
        {subText}
      </Text>
    )}
  </TouchableOpacity>
);

/* ═══════════════════════════════════════════════════════════════
   CASH VS CREDIT BAR (Visual Comparison)
   ═══════════════════════════════════════════════════════════════ */
interface CashVsCreditBarProps {
  cash: number;
  credit: number;
  cashPercent: number;
  creditPercent: number;
  fontScale: number;
}

const CashVsCreditBar: React.FC<CashVsCreditBarProps> = ({ cash, credit, cashPercent, creditPercent, fontScale }) => (
  <View style={styles.cashCreditCard}>
    <View style={styles.cashCreditHeader}>
      <Text style={[styles.cashCreditTitle, { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale) }]}>
        Cash vs Credit
      </Text>
      <View style={styles.cashCreditLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={[styles.legendText, { fontSize: Typography.fontSize.xs * fontScale }]}>Cash {cashPercent}%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.stockLow }]} />
          <Text style={[styles.legendText, { fontSize: Typography.fontSize.xs * fontScale }]}>Credit {creditPercent}%</Text>
        </View>
      </View>
    </View>

    {/* Visual Bar */}
    <View style={styles.comparisonBar}>
      <View style={[styles.comparisonFill, { width: `${cashPercent}%`, backgroundColor: Colors.success }]} />
      <View style={[styles.comparisonFill, { width: `${creditPercent}%`, backgroundColor: Colors.stockLow }]} />
    </View>

    {/* Values */}
    <View style={styles.cashCreditValues}>
      <View style={styles.ccValue}>
        <MaterialCommunityIcons name="cash" size={14 * fontScale} color={Colors.success} />
        <Text style={[styles.ccValueText, { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale), color: Colors.success }]}>
          ₹{fmt(cash)}
        </Text>
      </View>
      <View style={styles.ccValue}>
        <MaterialCommunityIcons name="account-cash" size={14 * fontScale} color={Colors.stockLow} />
        <Text style={[styles.ccValueText, { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale), color: Colors.stockLow }]}>
          ₹{fmt(credit)}
        </Text>
      </View>
    </View>
  </View>
);

/* ═══════════════════════════════════════════════════════════════
   ALERT BADGE
   ═══════════════════════════════════════════════════════════════ */
interface AlertBadgeProps {
  count: number;
  label: string;
  color: string;
  icon: string;
  fontScale: number;
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ count, label, color, icon, fontScale }) => {
  if (count === 0) return null;
  return (
    <View style={[styles.alertBadge, { backgroundColor: color + '18', borderColor: color }]}>
      <MaterialCommunityIcons name={icon} size={14 * fontScale} color={color} />
      <Text style={[styles.alertText, { color, fontSize: Typography.fontSize.sm * fontScale }]}>
        {count} {label}
      </Text>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TOP SELLER ROW - FIXED: Added id to type & fontScale prop
   ═══════════════════════════════════════════════════════════════ */
interface TopSellerItem {
  id: number;
  name: string;
  quantity: number;
}

interface TopSellerRowProps {
  item: TopSellerItem;
  index: number;
  max: number;
  fontScale: number;
}

const TopSellerRow: React.FC<TopSellerRowProps> = ({ item, index, max, fontScale }) => {
  const width = max > 0 ? Math.max(20, (item.quantity / max) * 100) : 20;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <View style={[styles.topSellerRow, index > 0 && styles.topSellerBorder]}>
      <Text style={[styles.sellerRank, { fontSize: Typography.fontSize.sm * fontScale }]}>
        {medals[index] || `#${index + 1}`}
      </Text>
      <View style={styles.sellerInfo}>
        <Text style={[styles.sellerName, { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale) }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={[styles.sellerBarBg, { width: chartWidth - 100 }]}>
          <View style={[styles.sellerBarFill, { width: `${width}%` }]} />
        </View>
      </View>
      <Text style={[styles.sellerQty, { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale) }]}>
        {item.quantity}
      </Text>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN SCREEN
   ═══════════════════════════════════════════════════════════════ */
const DashboardScreen = ({ navigation }: any) => {
  const { fontScale } = useUISettings();

  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [big3, setBig3] = useState({ todayCash: 0, todayCredit: 0, itemsSold: 0, totalSales: 0 });
  const [trend, setTrend] = useState<{ label: string; value: number }[]>([]);
  const [cashVsCredit, setCashVsCredit] = useState({ cash: 0, credit: 0, cashPercent: 50, creditPercent: 50 });
  const [alerts, setAlerts] = useState({ lowStock: 0, outOfStock: 0 });
  const [topSellers, setTopSellers] = useState<TopSellerItem[]>([]);
  const [creditToCollect, setCreditToCollect] = useState(0);

  const loadData = useCallback(() => {
    setBig3(getBigThree(timeRange));
    setTrend(getSalesTrend(timeRange));
    setCashVsCredit(getCashVsCredit(timeRange));
    setAlerts(getInventoryAlerts());
    setTopSellers(getTopSellers(timeRange, 5));
    setCreditToCollect(getCreditToCollect());
  }, [timeRange]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const maxTrend = Math.max(...trend.map(d => d.value), 1);
  const maxSeller = Math.max(...topSellers.map(s => s.quantity), 1);

  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  const scaledSm = Typography.fontSize.sm * fontScale;
  const scaledXs = Typography.fontSize.xs * fontScale;

  const chartConfig = {
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    color: (opacity = 1) => Colors.primary,
    labelColor: (opacity = 1) => Colors.textLight,
    propsForDots: { r: '3', fill: Colors.primary, stroke: Colors.primary, strokeWidth: 2 },
    propsForLabels: { fontSize: 10 * fontScale },
    decimalPlaces: 0,
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { fontSize: scaledSm }]}>
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
          </Text>
          <Text style={[styles.title, { fontSize: getScaledFontSize(22, fontScale) }]}>
            Your Shop
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <MaterialCommunityIcons name="refresh" size={18 * fontScale} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Time Range Toggle ───────────────────────────────── */}
      <View style={styles.toggleSection}>
        <TimeRangeToggle selected={timeRange} onChange={setTimeRange} fontScale={fontScale} />
      </View>

      {/* ── THE BIG 3 (Addictive Numbers) ────────────────────── */}
      <View style={styles.heroGrid}>
        <HeroCard
          label="Cash Received"
          value={fmt(big3.todayCash)}
          icon="cash"
          color={Colors.success}
          subText={creditToCollect > 0 ? `₹${fmt(creditToCollect)} to collect` : undefined}
          fontScale={fontScale}
          onPress={() => navigation.navigate('Sales')}
        />
        <HeroCard
          label="Credit Given"
          value={fmt(big3.todayCredit)}
          icon="account-cash"
          color={Colors.stockLow}
          fontScale={fontScale}
          onPress={() => navigation.navigate('Customers')}
        />
        <HeroCard
          label="Items Sold"
          value={fmt(big3.itemsSold)}
          icon="package-variant"
          color={Colors.primary}
          fontScale={fontScale}
          onPress={() => navigation.navigate('Inventory')}
        />
      </View>

      {/* ── Sales Trend Chart ───────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: scaledMd }]}>
            {timeRange === 'today' ? 'Today\'s Sales' : timeRange === 'week' ? 'Weekly Trend' : 'Monthly Trend'}
          </Text>
          <Text style={[styles.sectionTotal, { fontSize: scaledSm }]}>
            ₹{fmt(big3.totalSales)} total
          </Text>
        </View>
        
        <View style={styles.chartCard}>
          {trend.some(d => d.value > 0) ? (
            <LineChart
              data={{
                labels: trend.map(d => d.label),
                datasets: [{ data: trend.map(d => d.value) }],
              }}
              width={chartWidth - Spacing.lg * 2}
              height={180}
              yAxisLabel="₹"
              yAxisSuffix=""
              withInnerLines={true}
              withOuterLines={false}
              withShadow={true}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <MaterialCommunityIcons name="chart-line" size={32 * fontScale} color={Colors.textLight} />
              <Text style={[styles.emptyChartText, { fontSize: scaledMd }]}>No sales yet</Text>
              <Text style={[styles.emptyChartSub, { fontSize: scaledXs }]}>Complete a sale to see trends</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Cash vs Credit Comparison ───────────────────────── */}
      <View style={styles.section}>
        <CashVsCreditBar
          cash={cashVsCredit.cash}
          credit={cashVsCredit.credit}
          cashPercent={cashVsCredit.cashPercent}
          creditPercent={cashVsCredit.creditPercent}
          fontScale={fontScale}
        />
      </View>

      {/* ── Inventory Alerts ─────────────────────────────────── */}
      {(alerts.lowStock > 0 || alerts.outOfStock > 0) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: scaledMd }]}>⚠️ Inventory Alerts</Text>
          <View style={styles.alertRow}>
            <AlertBadge count={alerts.lowStock} label="Low Stock" color={Colors.stockLow} icon="alert" fontScale={fontScale} />
            <AlertBadge count={alerts.outOfStock} label="Out of Stock" color={Colors.error} icon="close-circle" fontScale={fontScale} />
          </View>
        </View>
      )}

      {/* ── Top Sellers ──────────────────────────────────────── */}
      {topSellers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: scaledMd }]}>🔥 Top Sellers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
              <Text style={[styles.viewAll, { fontSize: scaledXs }]}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topSellersCard}>
            {topSellers.map((item, idx) => (
              <TopSellerRow
                key={item.id}
                item={item}
                index={idx}
                max={maxSeller}
                fontScale={fontScale}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Quick Actions ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: scaledMd }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary + '18' }]} onPress={() => navigation.navigate('Sell')}>
            <MaterialCommunityIcons name="cart-plus" size={22 * fontScale} color={Colors.primary} />
            <Text style={[styles.actionText, { fontSize: scaledSm, color: Colors.primary }]}>New Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.stockLow + '18' }]} onPress={() => navigation.navigate('Inventory')}>
            <MaterialCommunityIcons name="package" size={22 * fontScale} color={Colors.stockLow} />
            <Text style={[styles.actionText, { fontSize: scaledSm, color: Colors.stockLow }]}>Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary + '18' }]} onPress={() => navigation.navigate('Customers')}>
            <MaterialCommunityIcons name="account-group" size={22 * fontScale} color={Colors.secondary} />
            <Text style={[styles.actionText, { fontSize: scaledSm, color: Colors.secondary }]}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warning + '18' }]} onPress={() => navigation.navigate('Reports')}>
            <MaterialCommunityIcons name="chart-bar" size={22 * fontScale} color={Colors.warning} />
            <Text style={[styles.actionText, { fontSize: scaledSm, color: Colors.warning }]}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  greeting: { color: Colors.textLight, fontWeight: Typography.fontWeight.medium },
  title: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.bold },
  refreshBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadow.sm },

  /* Toggle Section */
  toggleSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  toggleContainer: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.sm, ...Shadow.sm },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleBtnText: { color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  toggleBtnTextActive: { color: Colors.textInverse, fontWeight: Typography.fontWeight.semibold },

  /* Hero Grid */
  heroGrid: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  heroCard: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.md },
  heroIconWrap: { width: 34, height: 34, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  heroValue: { color: Colors.textInverse, fontWeight: Typography.fontWeight.bold },
  heroLabel: { color: Colors.textInverse, opacity: 0.85, fontWeight: Typography.fontWeight.medium, marginTop: 2 },
  heroSub: { color: Colors.textInverse, opacity: 0.7, marginTop: Spacing.xs, fontWeight: Typography.fontWeight.medium },

  /* Section */
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.bold },
  sectionTotal: { color: Colors.textLight, fontWeight: Typography.fontWeight.medium },
  viewAll: { color: Colors.primary, fontWeight: Typography.fontWeight.semibold },

  /* Chart Card */
  chartCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
  chart: { marginVertical: Spacing.sm, borderRadius: BorderRadius.md },
  emptyChart: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyChartText: { color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  emptyChartSub: { color: Colors.textLight },

  /* Cash vs Credit */
  cashCreditCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
  cashCreditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  cashCreditTitle: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.bold },
  cashCreditLegend: { flexDirection: 'row', gap: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  comparisonBar: { flexDirection: 'row', height: 12, borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.lg },
  comparisonFill: { height: '100%' },
  cashCreditValues: { flexDirection: 'row', justifyContent: 'space-around' },
  ccValue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  ccValueText: { fontWeight: Typography.fontWeight.bold },

  /* Alerts */
  alertRow: { flexDirection: 'row', gap: Spacing.md },
  alertBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  alertText: { fontWeight: Typography.fontWeight.semibold },

  /* Top Sellers */
  topSellersCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
  topSellerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  topSellerBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  sellerRank: { width: 28, textAlign: 'center', fontWeight: Typography.fontWeight.bold },
  sellerInfo: { flex: 1 },
  sellerName: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing.xs },
  sellerBarBg: { height: 6, backgroundColor: Colors.greenLow, borderRadius: 3, overflow: 'hidden' },
  sellerBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  sellerQty: { color: Colors.primary, fontWeight: Typography.fontWeight.bold, minWidth: 30, textAlign: 'right' },

  /* Quick Actions */
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg },
  actionText: { fontWeight: Typography.fontWeight.semibold },

  bottomSpacer: { height: Spacing.xxl },
});

export default DashboardScreen;
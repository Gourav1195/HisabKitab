import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
// import { format } from 'date-fns';
import { Colors } from '../../theme/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface CreditDashboardProps {
  summary: any;
  chartView: 'trend' | 'balance';
  setChartView: (view: 'trend' | 'balance') => void;
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  timeBuckets: any[];
  customers: any[];
}

const CreditDashboard: React.FC<CreditDashboardProps> = ({
  summary,
  chartView,
  setChartView,
  timeRange,
  timeBuckets,
  customers,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const safeNumber = (v: any) =>
    typeof v === 'number' && !isNaN(v) ? v : 0;

  const renderCreditTrendChart = () => {
    if (timeBuckets.length === 0) return null;

   const labels = timeBuckets.map(bucket => {
    switch (timeRange) {
        case 'week':
        return bucket.label; // already day-based
        case 'month':
        return `Week ${bucket.label.split('-')[1]}`;
        case 'quarter':
        case 'year':
        default:
        return bucket.label; // 'YYYY-MM'
    }
    });

    const chartData = {
      labels: labels,
      datasets: [
        {
          data: timeBuckets.map(b => safeNumber(b.totalCredit)),
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: timeBuckets.map(b => safeNumber(b.totalPaid)),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        }
      ]
    };

    const chartConfig = {
      backgroundGradientFrom: Colors.surface,
      backgroundGradientTo: Colors.surface,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 2,
      decimalPlaces: 0,
      propsForDots: {
        r: "4",
        strokeWidth: "2",
      },
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            {chartView === 'trend' ? 'Credit Trend' : 'Outstanding Balance'}
          </Text>
          <View style={styles.chartToggle}>
            <TouchableOpacity
              style={[styles.chartToggleButton, chartView === 'trend' && styles.activeChartToggle]}
              onPress={() => setChartView('trend')}
            >
              <Text style={[styles.chartToggleText, chartView === 'trend' && styles.activeChartToggleText]}>
                Trend
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartToggleButton, chartView === 'balance' && styles.activeChartToggle]}
              onPress={() => setChartView('balance')}
            >
              <Text style={[styles.chartToggleText, chartView === 'balance' && styles.activeChartToggleText]}>
                Balance
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {chartView === 'trend' ? (
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withShadow={false}
            segments={4}
          />
        ) : (
          <BarChart
            data={{
              labels: labels,
              datasets: [{
                data: timeBuckets.map(b => safeNumber(b.remaining))
              }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            }}
            style={styles.chart}
            showBarTops={false}
            withInnerLines={true}
            fromZero={true}
            yAxisLabel="₹"
            yAxisSuffix=""
          />
        )}
        <View style={styles.chartLegend}>
          {chartView === 'trend' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>Credit Given</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Paid Back</Text>
              </View>
            </>
          ) : (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Remaining Balance</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCompositionPieChart = () => {
    if (!summary) return null;

    const pieData = [
      {
        name: 'Paid',
        amount: summary.totalPaid,
        color: '#4CAF50',
        legendFontColor: Colors.textPrimary,
        legendFontSize: 12
      },
      {
        name: 'Remaining',
        amount: summary.totalRemaining,
        color: '#FF9800',
        legendFontColor: Colors.textPrimary,
        legendFontSize: 12
      }
    ];

    if (summary.totalPaid === 0 && summary.totalRemaining === 0) return null;

    const chartConfig = {
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    return (
      <View style={styles.pieChartContainer}>
        <Text style={styles.chartTitle}>Payment Composition</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={180}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[0, 0]}
          absolute
        />
        <View style={styles.pieChartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>
              Paid: ₹{summary.totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>
              Due: ₹{summary.totalRemaining.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTopOverdueCustomers = () => {
    const overdueCustomers = customers
      .filter(c => c.remainingBalance > 0)
      .sort((a, b) => b.remainingBalance - a.remainingBalance)
      .slice(0, 5);

    if (overdueCustomers.length === 0) return null;

    return (
      <View style={styles.topCustomersContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.error} />
          <Text style={styles.sectionTitle}>Top 5 Overdue Customers</Text>
        </View>
        {overdueCustomers.map((customer, index) => (
          <View key={customer.id} style={styles.topCustomerItem}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.topCustomerInfo}>
              <Text style={styles.topCustomerName}>{customer.name}</Text>
              {customer.phone && (
                <Text style={styles.topCustomerPhone}>{customer.phone}</Text>
              )}
            </View>
            <View style={styles.topCustomerAmounts}>
              <Text style={styles.topCustomerAmount}>
                ₹{customer.remainingBalance.toLocaleString()}
              </Text>
              <Text style={styles.overdueDays}>
                {customer.daysOverdue > 0 ? `${customer.daysOverdue}d overdue` : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSummaryCards = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.primary }]}>
          <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
          <Text style={styles.summaryValue}>{summary.totalCustomers}</Text>
          <Text style={styles.summaryLabel}>Customers</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
          <MaterialCommunityIcons name="cash" size={20} color={Colors.success} />
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalCredit)}</Text>
          <Text style={styles.summaryLabel}>Total Credit</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: Colors.info }]}>
          <MaterialCommunityIcons name="check-circle" size={20} color={Colors.info} />
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalPaid)}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.warning} />
          <Text style={[styles.summaryValue, styles.remainingValue]}>
            {formatCurrency(summary.totalRemaining)}
          </Text>
          <Text style={styles.summaryLabel}>Remaining</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSummaryCards()}
      {renderCreditTrendChart()}
      {renderCompositionPieChart()}
      {renderTopOverdueCustomers()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  remainingValue: {
    color: Colors.warning,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
  },
  chartToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeChartToggle: {
    backgroundColor: Colors.primary,
  },
  chartToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeChartToggleText: {
    color: Colors.surface,
  },
  chart: {
    borderRadius: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  pieChartContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pieChartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  topCustomersContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.errorLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
  },
  topCustomerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
  topCustomerInfo: {
    flex: 1,
  },
  topCustomerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  topCustomerPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topCustomerAmounts: {
    alignItems: 'flex-end',
  },
  topCustomerAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  overdueDays: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
});

export default CreditDashboard;
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { Colors } from '../../theme/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface CreditDashboardProps {
  summary: any;
  chartView: 'trend' | 'balance';
  setChartView: (view: 'trend' | 'balance') => void;
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  setTimeRange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
  timeBuckets: any[];
  customers: any[];
}

const CreditDashboard: React.FC<CreditDashboardProps> = ({
  summary,
  chartView,
  setChartView,
  timeRange,
//   setTimeRange,
  timeBuckets,
  customers,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const renderCreditTrendChart = () => {
    if (timeBuckets.length === 0) return null;

    const labels = timeBuckets.map(bucket => {
      if (timeRange === 'week') {
        return format(new Date(bucket.label), 'EEE');
      } else if (timeRange === 'month') {
        return `W${bucket.label.split('-')[1]}`;
      } else {
        return format(new Date(bucket.label + '-01'), 'MMM');
      }
    });

    const chartData = {
      labels: labels,
      datasets: [
        {
          data: timeBuckets.map(b => b.totalCredit),
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: timeBuckets.map(b => b.totalPaid),
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
        <Text style={styles.chartTitle}>
          {chartView === 'trend' ? 'Credit Trend' : 'Outstanding Balance'}
        </Text>
        {chartView === 'trend' ? (
          <LineChart
            data={chartData}
            width={screenWidth - 32}
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
                data: timeBuckets.map(b => b.remaining)
              }]
            }}
            width={screenWidth - 32}
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
          width={screenWidth - 32}
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
        <Text style={styles.sectionTitle}>Top 5 Overdue Customers</Text>
        {overdueCustomers.map((customer, index) => (
          <View key={customer.id} style={styles.topCustomerItem}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.topCustomerInfo}>
              <Text style={styles.topCustomerName}>{customer.name}</Text>
              <Text style={styles.topCustomerPhone}>{customer.phone}</Text>
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
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="account-group" size={24} color={Colors.primary} />
          <Text style={styles.summaryLabel}>Total Customers</Text>
          <Text style={styles.summaryValue}>{summary.totalCustomers}</Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="cash" size={24} color={Colors.success} />
          <Text style={styles.summaryLabel}>Total Credit</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalCredit)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="check-circle" size={24} color={Colors.info} />
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalPaid)}</Text>
        </View>

        <View style={[styles.summaryCard, styles.remainingCard]}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={Colors.warning} />
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, styles.remainingValue]}>
            {formatCurrency(summary.totalRemaining)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {renderSummaryCards()}

      <View style={styles.chartToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, chartView === 'trend' && styles.activeToggle]}
          onPress={() => setChartView('trend')}
        >
          <MaterialCommunityIcons 
            name="chart-line" 
            size={16} 
            color={chartView === 'trend' ? Colors.surface : Colors.textSecondary} 
          />
          <Text style={[styles.toggleText, chartView === 'trend' && styles.activeToggleText]}>
            Credit Trend
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, chartView === 'balance' && styles.activeToggle]}
          onPress={() => setChartView('balance')}
        >
          <MaterialCommunityIcons 
            name="chart-bar" 
            size={16} 
            color={chartView === 'balance' ? Colors.surface : Colors.textSecondary} 
          />
          <Text style={[styles.toggleText, chartView === 'balance' && styles.activeToggleText]}>
            Outstanding
          </Text>
        </TouchableOpacity>
      </View>

      {renderCreditTrendChart()}
      {renderCompositionPieChart()}
      {renderTopOverdueCustomers()}
    </>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  remainingCard: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  remainingValue: {
    color: Colors.warning,
  },
  chartToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeToggleText: {
    color: Colors.surface,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pieChartContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  pieChartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topCustomersContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.errorLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 12,
  },
  topCustomerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  topCustomerInfo: {
    flex: 1,
  },
  topCustomerName: {
    fontSize: 14,
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
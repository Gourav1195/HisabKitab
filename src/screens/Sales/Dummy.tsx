
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  RefreshControl,
  // SafeAreaView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDB } from '../../db';
import { Colors } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { format, subDays, subMonths
  // ,subWeeks,  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval 
} from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');

interface CustomerLedger {
  id: number;
  name: string;
  phone: string;
  totalCredit: number;
  totalPaid: number;
  remainingBalance: number;
  lastTransactionDate: number;
  daysOverdue: number;
}

interface TimeBucket {
  label: string;
  startDate: number;
  endDate: number;
  totalCredit: number;
  totalPaid: number;
  remaining: number;
  transactionCount: number;
}

interface CreditSummary {
  totalCustomers: number;
  totalCredit: number;
  totalPaid: number;
  totalRemaining: number;
  averageCredit: number;
  maxCredit: number;
  overdueCustomers: number;
  collectionRate: number; // (totalPaid / totalCredit) * 100
  avgDaysToPay: number;
}

interface LedgerTransaction {
  id: number;
  customer_id: number;
  type: 'SALE' | 'PAYMENT';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  sale_id: number | null;
  note: string | null;
  created_at: number;
  customer_name?: string;
}

const CreditLedgerScreen: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerLedger[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLedger | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [chartView, setChartView] = useState<'trend' | 'balance'>('trend');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [timeBuckets, setTimeBuckets] = useState<TimeBucket[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const loadLedgerData = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDB();

      // Enhanced query with days overdue calculation
      const query = `
        SELECT 
          c.id,
          c.name,
          c.phone,
          COALESCE(SUM(CASE WHEN l.direction = 'DEBIT' THEN l.amount ELSE 0 END), 0) as total_credit,
          COALESCE(SUM(CASE WHEN l.direction = 'CREDIT' THEN l.amount ELSE 0 END), 0) as total_paid,
          MAX(l.created_at) as last_transaction_date,
          CASE 
            WHEN MAX(l.created_at) IS NOT NULL AND (SUM(CASE WHEN l.direction = 'DEBIT' THEN l.amount ELSE 0 END) - SUM(CASE WHEN l.direction = 'CREDIT' THEN l.amount ELSE 0 END)) > 0
            THEN (${Date.now()} - MAX(l.created_at)) / (1000 * 60 * 60 * 24)
            ELSE 0
          END as days_overdue
        FROM customers c
        LEFT JOIN ledger l ON c.id = l.customer_id
        WHERE c.is_deleted = 0
        GROUP BY c.id, c.name, c.phone
        HAVING total_credit > 0 OR total_paid > 0
        ORDER BY (total_credit - total_paid) DESC
      `;

      const result = db.execute(query);
      const customersList: CustomerLedger[] = [];

      if (result.rows && result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          const totalCredit = row.total_credit || 0;
          const totalPaid = row.total_paid || 0;
          const remainingBalance = totalCredit - totalPaid;

          customersList.push({
            id: row.id,
            name: row.name,
            phone: row.phone || '',
            totalCredit,
            totalPaid,
            remainingBalance,
            lastTransactionDate: row.last_transaction_date || Date.now(),
            daysOverdue: Math.floor(row.days_overdue || 0)
          });
        }
      }

      setCustomers(customersList);
      setFilteredCustomers(customersList);
      calculateSummary(customersList);
    } catch (error) {
      console.error('Error loading ledger data:', error);
      Alert.alert('Error', 'Failed to load ledger data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },[]);

  const loadTimeSeriesData = useCallback(async () => {
    try {
      const db = getDB();
      const now = Date.now();
      let startDate: number;
      let interval: 'day' | 'week' | 'month';

      // Determine time range
      switch (timeRange) {
        case 'week':
          startDate = subDays(now, 7).getTime();
          interval = 'day';
          break;
        case 'month':
          startDate = subDays(now, 30).getTime();
          interval = 'week';
          break;
        case 'quarter':
          startDate = subMonths(now, 3).getTime();
          interval = 'month';
          break;
        case 'year':
        default:
          startDate = subMonths(now, 12).getTime();
          interval = 'month';
          break;
      }

      // Query for time series data
      const query = `
        SELECT 
          ${interval === 'day' ? "date(l.created_at/1000, 'unixepoch', 'localtime')" :
            interval === 'week' ? "strftime('%Y-%W', l.created_at/1000, 'unixepoch', 'localtime')" :
            "strftime('%Y-%m', l.created_at/1000, 'unixepoch', 'localtime')"} as time_period,
          SUM(CASE WHEN l.direction = 'DEBIT' THEN l.amount ELSE 0 END) as total_credit,
          SUM(CASE WHEN l.direction = 'CREDIT' THEN l.amount ELSE 0 END) as total_paid,
          COUNT(*) as transaction_count
        FROM ledger l
        WHERE l.created_at >= ${startDate}
        GROUP BY time_period
        ORDER BY time_period
      `;

      const result = db.execute(query);
      const buckets: TimeBucket[] = [];

      if (result.rows && result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          const credit = row.total_credit || 0;
          const paid = row.total_paid || 0;
          
          buckets.push({
            label: row.time_period,
            startDate: 0, // We'll calculate this based on interval
            endDate: 0,
            totalCredit: credit,
            totalPaid: paid,
            remaining: credit - paid,
            transactionCount: row.transaction_count || 0
          });
        }
      }

      setTimeBuckets(buckets);
    } catch (error) {
      console.error('Error loading time series data:', error);
    }
  },[timeRange]);
  
  useEffect(() => {
    loadLedgerData();
    loadTimeSeriesData();
  }, [loadLedgerData, loadTimeSeriesData]);

  const calculateSummary = (customerList: CustomerLedger[]) => {
    const totalCredit = customerList.reduce((sum, c) => sum + c.totalCredit, 0);
    const totalPaid = customerList.reduce((sum, c) => sum + c.totalPaid, 0);
    const totalRemaining = customerList.reduce((sum, c) => sum + c.remainingBalance, 0);
    const overdueCustomers = customerList.filter(c => c.remainingBalance > 0).length;
    const maxCredit = Math.max(...customerList.map(c => c.remainingBalance), 0);
    const collectionRate = totalCredit > 0 ? (totalPaid / totalCredit) * 100 : 0;
   const payingCustomers = customerList.filter(c => c.totalPaid > 0);
    const avgDaysToPay = payingCustomers.length > 0 
      ? payingCustomers.reduce((sum, c) => sum + c.daysOverdue, 0) / payingCustomers.length
      : 0;

    setSummary({
      totalCustomers: customerList.length,
      totalCredit,
      totalPaid,
      totalRemaining,
      averageCredit: customerList.length > 0 ? totalRemaining / customerList.length : 0,
      maxCredit,
      overdueCustomers,
      collectionRate,
      avgDaysToPay: Math.floor(avgDaysToPay)
    });
  };

  
  const loadCustomerTransactions = async (customerId: number) => {
    try {
      const db = getDB();
      const query = `
        SELECT 
          l.*,
          c.name as customer_name
        FROM ledger l
        JOIN customers c ON l.customer_id = c.id
        WHERE l.customer_id = ?
        ORDER BY l.created_at DESC
      `;

      const result = db.execute(query, [customerId]);
      const transactions: LedgerTransaction[] = [];

      if (result.rows && result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          transactions.push({
            id: row.id,
            customer_id: row.customer_id,
            type: row.type,
            direction: row.direction,
            amount: row.amount,
            sale_id: row.sale_id,
            note: row.note,
            created_at: row.created_at,
            customer_name: row.customer_name
          });
        }
      }

      setCustomerTransactions(transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleCustomerPress = async (customer: CustomerLedger) => {
    setSelectedCustomer(customer);
    await loadCustomerTransactions(customer.id);
    setModalVisible(true);
  };
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd MMM yyyy, hh:mm a');
  };
  const renderCustomerItem = ({ item }: { item: CustomerLedger }) => (
    
    <TouchableOpacity
      style={[
        styles.customerCard,
        item.remainingBalance > 0 && styles.overdueCard
      ]}
      onPress={() => handleCustomerPress(item)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.phone ? (
            <Text style={styles.customerPhone}>{item.phone}</Text>
          ) : null}
          <Text style={styles.lastTransaction}>
            Last: {formatDate(item.lastTransactionDate)}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={Colors.textLight}
        />
      </View>

      <View style={styles.amountsContainer}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Credit</Text>
          <Text style={styles.creditAmount}>
            {formatCurrency(item.totalCredit)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={styles.paidAmount}>
            {formatCurrency(item.totalPaid)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text style={[
            styles.remainingAmount,
            item.remainingBalance > 0 ? styles.overdueAmount : styles.settledAmount
          ]}>
            {formatCurrency(item.remainingBalance)}
          </Text>
        </View>
      </View>

      {item.remainingBalance > 0 && (
        <View style={styles.overdueBadge}>
          <MaterialCommunityIcons name="alert" size={12} color={Colors.error} />
          <Text style={styles.overdueText}>OVERDUE</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCreditTrendChart = () => {
    if (timeBuckets.length === 0) return null;

    const labels = timeBuckets.map(bucket => {
      // Format labels based on time range
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
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red for credit
          strokeWidth: 2,
        },
        {
          data: timeBuckets.map(b => b.totalPaid),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for paid
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
              color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Orange for remaining
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

    // Only show pie chart if we have both values
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
    const formatCurrency = (amount: number) => {
      return `₹${amount.toFixed(2)}`;
    };

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

  const onRefresh = () => {
    setRefreshing(true);
    loadLedgerData();
  };

  
  const renderTransactionItem = ({ item }: { item: LedgerTransaction }) => (
    <View style={[
      styles.transactionItem,
      item.direction === 'DEBIT' ? styles.debitTransaction : styles.creditTransaction
    ]}>
      <View style={styles.transactionHeader}>
        <View>
          <Text style={styles.transactionType}>
            {item.type === 'SALE' ? 'Sale' : 'Payment'}
            {' • '}
            {item.direction === 'DEBIT' ? 'Debit' : 'Credit'}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <Text style={[
          styles.transactionAmount,
          item.direction === 'DEBIT' ? styles.debitAmount : styles.creditAmount
        ]}>
          {item.direction === 'DEBIT' ? '-' : '+'}{formatCurrency(item.amount)}
        </Text>
      </View>
      {item.note && (
        <Text style={styles.transactionNote}>{item.note}</Text>
      )}
      {item.sale_id && (
        <Text style={styles.saleId}>
          Sale ID: {item.sale_id}
        </Text>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Ledger Data...</Text>
      </SafeAreaView>
    );
  }

   return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credit Ledger</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const ranges: Array<'week' | 'month' | 'quarter' | 'year'> = ['week', 'month', 'quarter', 'year'];
              const currentIndex = ranges.indexOf(timeRange);
              setTimeRange(ranges[(currentIndex + 1) % ranges.length]);
            }}
          >
            <Text style={styles.filterText}>
              {timeRange === 'week' ? '7 Days' : 
               timeRange === 'month' ? '30 Days' :
               timeRange === 'quarter' ? '3 Months' : '1 Year'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers by name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            All Customers ({filteredCustomers.length})
          </Text>
          <Text style={styles.listSubtitle}>
            Total Due: ₹{filteredCustomers.reduce((sum, c) => sum + c.remainingBalance, 0).toLocaleString()}
          </Text>
        </View>

        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="credit-card-off"
              size={64}
              color={Colors.textLight}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No customers found' : 'No credit records found'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Sales marked as credit will appear here
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedCustomer?.name}
              </Text>
              <Text style={styles.modalSubtitle}>
                Ledger Details
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {selectedCustomer && (
            <View style={styles.customerSummary}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabelSmall}>Total Credit</Text>
                  <Text style={styles.summaryValueSmall}>
                    {formatCurrency(selectedCustomer.totalCredit)}
                  </Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabelSmall}>Total Paid</Text>
                  <Text style={styles.summaryValueSmall}>
                    {formatCurrency(selectedCustomer.totalPaid)}
                  </Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabelSmall}>Balance</Text>
                  <Text style={[
                    styles.summaryValueSmall,
                    selectedCustomer.remainingBalance > 0 ? styles.overdueTextColor : styles.settledTextColor
                  ]}>
                    {formatCurrency(selectedCustomer.remainingBalance)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <FlatList
            data={customerTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.transactionsList}
            ListEmptyComponent={
              <View style={styles.emptyTransactions}>
                <MaterialCommunityIcons
                  name="receipt"
                  size={48}
                  color={Colors.textLight}
                />
                <Text style={styles.emptyTransactionsText}>
                  No transactions found
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  overdueCard: {
    borderColor: Colors.errorLight,
    backgroundColor: Colors.errorLight + '10',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  lastTransaction: {
    fontSize: 12,
    color: Colors.textLight,
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  creditAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  paidAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  overdueAmount: {
    color: Colors.error,
  },
  settledAmount: {
    color: Colors.success,
  },
  overdueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.error,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 32,
  },
  customerSummary: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryColumn: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabelSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValueSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  overdueTextColor: {
    color: Colors.error,
  },
  settledTextColor: {
    color: Colors.success,
  },
  transactionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  debitTransaction: {
    borderLeftColor: Colors.error,
  },
  creditTransaction: {
    borderLeftColor: Colors.success,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  debitAmount: {
    color: Colors.error,
  },
//   creditAmount: {
//     color: Colors.success,
//   },
  transactionNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  saleId: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
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

export default CreditLedgerScreen;
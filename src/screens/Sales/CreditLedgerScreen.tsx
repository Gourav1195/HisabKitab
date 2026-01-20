import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  RefreshControl,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDB } from '../../db';
import { Colors } from '../../theme/Colors';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, subDays, subMonths } from 'date-fns';
import CreditDashboard from '../../components/Credit/CreditDashboard';
import CustomerList from '../../components/Credit/CustomerList';
import { TouchableOpacity } from 'react-native';

const CreditLedgerScreen: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [chartView, setChartView] = useState<'trend' | 'balance'>('trend');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [timeBuckets, setTimeBuckets] = useState<any[]>([]);

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
      const customersList: any[] = [];

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
  }, []);

  const loadTimeSeriesData = useCallback(async () => {
    try {
      const db = getDB();
      const now = Date.now();
      let startDate: number;
      let interval: 'day' | 'week' | 'month';

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
      const buckets: any[] = [];

      if (result.rows && result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          const credit = row.total_credit || 0;
          const paid = row.total_paid || 0;
          
          buckets.push({
            label: row.time_period,
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
  }, [timeRange]);
  
  useEffect(() => {
    loadLedgerData();
    loadTimeSeriesData();
  }, [loadLedgerData, loadTimeSeriesData]);

  const calculateSummary = (customerList: any[]) => {
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
      const transactions: any[] = [];

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

  const handleCustomerPress = async (customer: any) => {
    setSelectedCustomer(customer);
    await loadCustomerTransactions(customer.id);
    setModalVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLedgerData();
  };

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
        <CreditDashboard
          summary={summary}
          chartView={chartView}
          setChartView={setChartView}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          timeBuckets={timeBuckets}
          customers={customers}
        />
        
        <CustomerList
          customers={customers}
          filteredCustomers={filteredCustomers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCustomerPress={handleCustomerPress}
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Modal content remains the same */}
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
});

export default CreditLedgerScreen;
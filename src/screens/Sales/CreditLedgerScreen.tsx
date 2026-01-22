import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  RefreshControl,
  // Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  Linking,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDB } from '../../db';
import { Colors } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, subDays, subMonths } from 'date-fns';
import CreditDashboard from '../../components/Credit/CreditDashboard';
import CustomerList from '../../components/Credit/CustomerList';
import LedgerAmount from '../../components/Credit/LedgerAmount';
import { ledgerStyles } from '../../components/Credit/ledgerStyles';
import { addPaymentEntry, addReminderLog, updateCustomerPhone } from '../../repo/creditRepo';

// const { width: screenWidth } = Dimensions.get('window');

interface CreditLedgerScreenProps { }

const CreditLedgerScreen: React.FC<CreditLedgerScreenProps> = () => {
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records'>('dashboard');
  const [payingCustomer, setPayingCustomer] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  // const [remindCustomer, setRemindCustomer] = useState<any | null>(null);
  const [editPhoneCustomer, setEditPhoneCustomer] = useState<any | null>(null);
  const [phoneInput, setPhoneInput] = useState('');

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

  const onPayCredit = (customer: any) => {
    setPayingCustomer(customer);
    setPayAmount('');
  };

  const sendReminder = (phone: string, customer: any) => {
    const message = `Hi ${customer.name}, this is a reminder for your pending balance of ₹${customer.remainingBalance.toFixed(2)}.`;
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open WhatsApp')
    );

    addReminderLog(customer.id, 'WHATSAPP');
  };

  const onRemindCustomer = (customer: any) => {
    if (customer.phone) {
      sendReminder(customer.phone, customer);
    } else {
      setEditPhoneCustomer(customer);
      setPhoneInput('');
    }
  };

  const renderTransactionItem = ({ item }: { item: any }) => (
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
            {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}
          </Text>
        </View>
        <Text style={[
          styles.transactionAmount,
          item.direction === 'DEBIT' ? styles.debitAmount : styles.creditAmount
        ]}>
          {item.direction === 'DEBIT' ? '-' : '+'}₹{item.amount.toFixed(2)}
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
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Credit Ledger</Text>
      </View> */}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <MaterialCommunityIcons
            name="chart-box"
            size={20}
            color={activeTab === 'dashboard' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'records' && styles.activeTab]}
          onPress={() => setActiveTab('records')}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={activeTab === 'records' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>
            Records ({customers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Filter (only for dashboard) */}
      {activeTab === 'dashboard' && (
        <View style={styles.timeFilterContainer}>
          <Text style={styles.timeFilterLabel}>Time Range:</Text>
          <View style={styles.timeFilterOptions}>
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeFilterButton,
                  timeRange === range && styles.activeTimeFilterButton
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[
                  styles.timeFilterText,
                  timeRange === range && styles.activeTimeFilterText
                ]}>
                  {range === 'week' ? '7D' :
                    range === 'month' ? '30D' :
                      range === 'quarter' ? '3M' : '1Y'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {activeTab === 'dashboard' ? (
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
            timeBuckets={timeBuckets}
            customers={customers}
          />
        </ScrollView>
      ) : (
        <CustomerList
          customers={customers}
          filteredCustomers={filteredCustomers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCustomerPress={handleCustomerPress}
          onPayCredit={onPayCredit}
          onRemindCustomer={onRemindCustomer}
        />
      )}

      <Modal visible={!!payingCustomer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.payModal}>
            <Text style={styles.modalTitle}>
              Receive Payment from {payingCustomer?.name}
            </Text>

            <TextInput
              placeholder="Amount"
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
              style={styles.input}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setPayingCustomer(null)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const amt = Number(payAmount);
                  if (!amt || amt <= 0) {
                    Alert.alert('Invalid amount');
                    return;
                  }

                  addPaymentEntry(payingCustomer.id, amt, 'Manual payment');
                  setPayingCustomer(null);
                  loadLedgerData();
                }}
              >
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>

          {/* Header */}
          <View style={ledgerStyles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="arrow-left" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={ledgerStyles.headerTitle}>Ledger</Text>
            <View style={{ width: 26 }} />
          </View>

          {selectedCustomer && (
            <View style={ledgerStyles.customerCard}>

              {/* Customer Header */}
              <View style={ledgerStyles.customerHeader}>
                <View
                  style={[
                    ledgerStyles.avatar,
                    {
                      backgroundColor:
                        selectedCustomer.remainingBalance > 0
                          ? Colors.error + '20'
                          : Colors.success + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      ledgerStyles.avatarText,
                      {
                        color:
                          selectedCustomer.remainingBalance > 0
                            ? Colors.error
                            : Colors.success,
                      },
                    ]}
                  >
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={ledgerStyles.customerName}>
                    {selectedCustomer.name}
                  </Text>
                  <Text style={ledgerStyles.subtitle}>Ledger Details</Text>
                </View>
              </View>

              {/* Amount Summary */}
              <View style={ledgerStyles.amountsRow}>
                <LedgerAmount
                  label="Credit"
                  value={selectedCustomer.totalCredit}
                  color={Colors.error}
                  icon="arrow-up-circle"
                />
                <LedgerAmount
                  label="Paid"
                  value={selectedCustomer.totalPaid}
                  color={Colors.success}
                  icon="arrow-down-circle"
                />
                <LedgerAmount
                  label="Balance"
                  value={selectedCustomer.remainingBalance}
                  color={
                    selectedCustomer.remainingBalance > 0
                      ? Colors.warning
                      : Colors.success
                  }
                  icon="scale-balance"
                  bold
                />
              </View>
            </View>
          )}

          {/* Transactions */}
          <FlatList
            data={customerTransactions}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={ledgerStyles.list}
            renderItem={renderTransactionItem}
            ListEmptyComponent={
              <View style={ledgerStyles.emptyState}>
                <MaterialCommunityIcons
                  name="receipt"
                  size={56}
                  color={Colors.textLight + '60'}
                />
                <Text style={ledgerStyles.emptyText}>
                  No transactions found
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
<Modal visible={!!editPhoneCustomer} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.payModal}>
      <Text style={styles.modalTitle}>
        Add Phone Number
      </Text>

      <Text style={{ marginBottom: 8 }}>
        {editPhoneCustomer?.name}
      </Text>

      <TextInput
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phoneInput}
        onChangeText={setPhoneInput}
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => setEditPhoneCustomer(null)}
        >
          <Text>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (!phoneInput.trim()) {
              Alert.alert('Phone required');
              return;
            }

            await updateCustomerPhone(
              editPhoneCustomer.id,
              phoneInput.trim()
            );

            sendReminder(phoneInput.trim(), editPhoneCustomer);

            setEditPhoneCustomer(null);
            loadLedgerData();
          }}
        >
          <Text>Save & Remind</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timeFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeFilterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTimeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTimeFilterText: {
    color: Colors.surface,
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
  creditAmount: {
    color: Colors.success,
  },
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.overlay,
  },
  payModal: {
    width: '90%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    // shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default CreditLedgerScreen;
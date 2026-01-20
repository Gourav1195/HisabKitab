import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/Colors';
import { format } from 'date-fns';

interface CustomerListProps {
  customers: any[];
  filteredCustomers: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleCustomerPress: (customer: any) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
  filteredCustomers,
  searchQuery,
  setSearchQuery,
  handleCustomerPress,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd MMM yyyy, hh:mm a');
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
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

  return (
    <>
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
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default CustomerList;
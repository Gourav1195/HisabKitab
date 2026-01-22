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

interface CustomerListProps {
  customers: any[];
  filteredCustomers: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleCustomerPress: (customer: any) => void;

  onPayCredit: (customer: any) => void;
  onRemindCustomer: (customer: any) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
  filteredCustomers,
  searchQuery,
  setSearchQuery,
  handleCustomerPress,
  onPayCredit,
  onRemindCustomer,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDaysAgo = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d`;
  };

  const renderCustomerItem = ({ item }: { item: any }) => {
  const hasDue = item.remainingBalance > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleCustomerPress(item)}
      style={[
        compactStyles.row,
        hasDue && compactStyles.overdueRow,
      ]}
    >
      {/* avatar */}
      <View style={[
        compactStyles.avatar,
        { backgroundColor: hasDue ? Colors.error + '18' : Colors.success + '12' }
      ]}>
        <Text style={[
          compactStyles.avatarText,
          { color: hasDue ? Colors.error : Colors.success }
        ]}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      {/* middle */}
      <View style={compactStyles.middle}>
        <Text style={compactStyles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={compactStyles.metaRow}>
          <Text style={compactStyles.metaText}>
            {item.phone || 'No phone'}
          </Text>
          <Text style={compactStyles.dot}>•</Text>
          <Text style={compactStyles.metaText}>
            {getDaysAgo(item.lastTransactionDate)}
          </Text>
        </View>

        {/* ACTION BUTTONS */}
        {hasDue && (
          <View style={compactStyles.actionsRow}>
            <TouchableOpacity
              style={[compactStyles.actionBtn, compactStyles.payBtn]}
              onPress={() => onPayCredit(item)}
            >
              <MaterialCommunityIcons name="cash-check" size={14} color={Colors.surface} />
              <Text style={compactStyles.payText}>Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[compactStyles.actionBtn, compactStyles.remindBtn]}
              onPress={() => onRemindCustomer(item)}
            >
              <MaterialCommunityIcons name="bell-outline" size={14} color={Colors.primary} />
              <Text style={compactStyles.remindText}>Remind</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* right */}
      <View style={compactStyles.right}>
        <Text style={[
          compactStyles.remaining,
          hasDue ? compactStyles.remainingWarn : compactStyles.remainingSettled
        ]}>
          {formatCurrency(item.remainingBalance)}
        </Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
};


  return (
    <View style={compactStyles.container}>
      {/* header */}
      <View style={compactStyles.header}>
        <Text style={compactStyles.title}>Customer Records</Text>
        <View style={compactStyles.countBadge}>
          <Text style={compactStyles.countText}>
            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
          </Text>
        </View>
      </View>

      {/* search */}
      <View style={compactStyles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={18} color={Colors.primary} />
        <TextInput
          style={compactStyles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* summary banner (kept compact) */}
      <View style={compactStyles.summary}>
        <View style={compactStyles.summaryItem}>
          <Text style={compactStyles.summaryLabel}>Total Due</Text>
          <Text style={compactStyles.summaryValue}>
            ₹{filteredCustomers.reduce((s, c) => s + c.remainingBalance, 0)
              .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={compactStyles.summaryDivider} />
        <View style={compactStyles.summaryItem}>
          <Text style={compactStyles.summaryLabel}>Overdue</Text>
          <Text style={[compactStyles.summaryValue, { color: Colors.error }]}>
            {filteredCustomers.filter(c => c.remainingBalance > 0).length}
          </Text>
        </View>
        <View style={compactStyles.summaryDivider} />
        <View style={compactStyles.summaryItem}>
          <Text style={compactStyles.summaryLabel}>Settled</Text>
          <Text style={[compactStyles.summaryValue, { color: Colors.success }]}>
            {filteredCustomers.filter(c => c.remainingBalance === 0).length}
          </Text>
        </View>
      </View>

      {/* list */}
      {filteredCustomers.length === 0 ? (
        <View style={compactStyles.empty}>
          <MaterialCommunityIcons name={searchQuery ? "account-search" : "credit-card-off"} size={64} color={Colors.textLight + '40'} />
          <Text style={compactStyles.emptyTitle}>
            {searchQuery ? 'No matching customers' : 'No credit records yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={compactStyles.list}
          ItemSeparatorComponent={() => <View style={compactStyles.separator} />}
        />
      )}
    </View>
  );
};

const compactStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  countText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
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

  summary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },

  list: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },

  separator: {
    height: 8,
  },

  /* compact row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  overdueRow: {
    borderColor: Colors.error + '30',
    backgroundColor: Colors.error + '03',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  smallCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  criticalPill: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.error + '12',
  },
  criticalText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
    marginLeft: 4,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  dot: {
    marginHorizontal: 6,
    color: Colors.textLight,
    fontSize: 12,
  },

  right: {
    alignItems: 'flex-end',
    marginRight: 8,
    marginLeft: 8,
  },
  remaining: {
    fontSize: 14,
    fontWeight: '800',
  },
  remainingWarn: {
    color: Colors.warning,
  },
  remainingSettled: {
    color: Colors.success,
  },
  smallAmounts: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  smallAmountCredit: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '700',
  },
  smallAmountPaid: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  actionsRow: {
  flexDirection: 'row',
  marginTop: 6,
  gap: 8,
},

actionBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 6,
  borderRadius: 8,
},

payBtn: {
  backgroundColor: Colors.success,
},

remindBtn: {
  borderWidth: 1,
  borderColor: Colors.primary,
  backgroundColor: Colors.primary + '12',
},

payText: {
  color: Colors.surface,
  fontSize: 12,
  fontWeight: '700',
},

remindText: {
  color: Colors.primary,
  fontSize: 12,
  fontWeight: '700',
},

});

export default CustomerList;

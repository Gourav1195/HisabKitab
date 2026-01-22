import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/Colors';

export const ledgerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  customerCard: {
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '800',
  },

  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },

  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },

  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  amountValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textLight,
  },
});

// components/Sales/CreditToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CreditToggleProps {
  isCredit: boolean;
  onToggle: () => void;
  customerName?: string;
}

const CreditToggle: React.FC<CreditToggleProps> = ({ 
  isCredit, 
  onToggle, 
  customerName 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCredit ? styles.creditActive : styles.saleActive
      ]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.toggleContent}>
        <MaterialCommunityIcons
          name={isCredit ? "credit-card-outline" : "cash"}
          size={20}
          color={isCredit ? Colors.error : Colors.success}
        />
        <View style={styles.textContainer}>
          <Text style={styles.modeText}>
            {isCredit ? 'CREDIT SALE' : 'CASH SALE'}
          </Text>
          {isCredit && customerName && (
            <Text style={styles.customerText} numberOfLines={1}>
              To: {customerName}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.toggleSwitch}>
        <View style={[
          styles.toggleKnob,
          isCredit && styles.toggleKnobCredit
        ]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  saleActive: {
    backgroundColor: '#E8F5E9', // Light green
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  creditActive: {
    backgroundColor: '#FFEBEE', // Light red
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  modeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  customerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 26,
    backgroundColor: Colors.surface,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    backgroundColor: Colors.success,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  toggleKnobCredit: {
    backgroundColor: Colors.error,
    alignSelf: 'flex-end',
  },
});

export default CreditToggle;
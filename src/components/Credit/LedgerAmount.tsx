import React from 'react';
import { View, Text,  } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ledgerStyles } from './ledgerStyles';

interface LedgerAmountProps {
    label: string;
    value: number;
    color: string;
    icon: string;
    bold?: boolean;
}

const LedgerAmount = ({ label, value, color, icon, bold = false }:LedgerAmountProps) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <MaterialCommunityIcons name={icon} size={14} color={color + '80'} />
      <Text style={ledgerStyles.amountLabel}>{label}</Text>
    </View>
    <Text
      style={[
        ledgerStyles.amountValue,
        { color },
        bold && { fontSize: 18, fontWeight: '800' },
      ]}
    >
      ₹{value.toFixed(2)}
    </Text>
  </View>
);
export default LedgerAmount;
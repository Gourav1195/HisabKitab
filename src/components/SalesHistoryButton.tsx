// components/SalesHistoryButton.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SalesHistoryButton = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('SalesHistory')}
      style={{ marginRight: 12 }}
    >
      <Text style={{ fontSize: 18 }}>🧾</Text>
    </TouchableOpacity>
  );
};

export default SalesHistoryButton;

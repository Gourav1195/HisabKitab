import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const SalesHistoryButton = () => {
  const navigation = useNavigation<any>();

  return (
    <>
    <TouchableOpacity
      onPress={() => navigation.navigate('CreditLedger')}
      style={{ marginRight: 12 }}
    >
      <MaterialCommunityIcons
        name="history-clock-outline"
        size={22}
        color="#007aff"
      />
    </TouchableOpacity>
   
    <TouchableOpacity
      onPress={() => navigation.navigate('SalesHistory')}
      style={{ marginRight: 12 }}
    >
      <MaterialCommunityIcons
        name="history"
        size={22}
        color="#007aff"
      />
    </TouchableOpacity>
    </>
  );
};

export default SalesHistoryButton;

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getSales, Sale } from '../../repo/salesRepo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SalesStackParamList } from '../../types/inventory';

const SalesHistoryScreen = () => {
  const navigation =   useNavigation<NativeStackNavigationProp<SalesStackParamList>>();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    setSales(getSales());
  }, []);

  return (
    <View style={styles.container}>
      {sales.length === 0 ? (
        <Text style={styles.empty}>No sales yet</Text>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={s => s.id.toString()}
renderItem={({ item }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={() =>
      navigation.navigate('SaleDetails', {
        saleId: item.id,
        total: item.total,
        createdAt: item.createdAt,
      })
    }
  >
    <Text style={styles.date}>
      {new Date(item.createdAt).toLocaleString()}
    </Text>
    <Text style={styles.total}>₹ {item.total}</Text>
  </TouchableOpacity>
)}
        />
      )}
    </View>
  );
};

export default SalesHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  date: {
    fontSize: 14,
    color: '#555',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getSaleItems } from '../../repo/salesRepo';

const SaleDetailsScreen = ({ route }: any) => {
  const { saleId, total, createdAt } = route.params;
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems(getSaleItems(saleId));
  }, [saleId]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        ₹ {total}
      </Text>
      <Text style={styles.sub}>
        {new Date(createdAt).toLocaleString()}
      </Text>

      <FlatList
        data={items}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{item.name}</Text>
            <Text>
              {item.quantity} × ₹{item.price}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default SaleDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: '600' },
  sub: { color: '#666', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
});

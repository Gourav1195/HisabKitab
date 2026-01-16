import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getLowStockItems } from '../repo/inventoryRepo';
import { Item } from '../types/inventory';

const LowStockScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<Item[]>([]);

  const load = () => {
    setItems(getLowStockItems());
  };

  useEffect(() => {
    load();
  }, []);

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>All good. No low-stock items.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={i => i.id.toString()}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            navigation.navigate('ItemDetail', { itemId: item.id })
          }
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.qty}>{item.quantity}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

export default LowStockScreen;
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  qty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d9534f',
  },
});

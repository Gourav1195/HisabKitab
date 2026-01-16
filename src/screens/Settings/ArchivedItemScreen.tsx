import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { getArchivedItems, restoreItem } from '../../repo/inventoryRepo';
import { Item } from '../../types/inventory';

const ArchivedItemsScreen = () => {
  const [items, setItems] = useState<Item[]>([]);

  const load = () => {
    setItems(getArchivedItems());
  };

  useEffect(() => {
    load();
  }, []);

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No archived items</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={i => i.id.toString()}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              Qty: {item.quantity}
            </Text>
          </View>

          <Button
            title="Restore"
            onPress={() => {
              restoreItem(item.id);
              load();
            }}
          />
        </View>
      )}
    />
  );
};

export default ArchivedItemsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    },
    center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    },
    row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    },
    name: {
    fontSize: 16,
    fontWeight: '500',
    },
    sub: {
    fontSize: 14,
    color: '#666',
    },
});

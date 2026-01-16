import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  TouchableOpacity,

} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  // addItem,
  getAllItems
} from '../repo/inventoryRepo';
import { Item } from '../types/inventory';

const SettingsButton = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 12 }}
    >
      <Text style={{ fontSize: 18 }}>⚙️</Text>
    </TouchableOpacity>
  );
};
const InventoryListScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: SettingsButton,
    });
  }, [navigation]);

  const loadItems = () => {
    try {
      const data = getAllItems();
      setItems(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load items', err);
      setItems([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Add Item" onPress={() => navigation.navigate('AddItem')} />

      <Text style={styles.header}>Inventory</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No items yet</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isLow = item.quantity <= item.low_stock_threshold;
            return (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ItemDetail', { itemId: item.id })
                }
              >
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.name,
                      isLow && styles.lowStock
                    ]}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[
                      styles.qty,
                      isLow && styles.lowStock
                    ]}
                  >
                    {item.quantity}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default InventoryListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
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
  name: {
    fontSize: 16,
  },
  qty: {
    fontSize: 16,
    fontWeight: '500',
  },
  lowStock: {
    color: '#d9534f',
  },

});

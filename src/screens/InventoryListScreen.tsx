import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getAllItems } from '../repo/inventoryRepo';
import { Item } from '../types/inventory';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography } from '../theme/Colors';
import AddItemForm from '../components/Inventory/AddItem';

const SettingsButton = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: Spacing.md }}
    >
      <MaterialCommunityIcons
        name="cog"
        size={20}
        color={Colors.primary}
      />
    </TouchableOpacity>
  );
};

const InventoryListScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlphaIndex, setShowAlphaIndex] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  // Move HeaderRightActions outside of render to avoid unstable nested components
  const HeaderRightActions = React.useCallback(() => (
    <View style={styles.headerRightActions}>
      <TouchableOpacity
        onPress={() => setFontScale(prev => Math.max(0.8, prev - 0.1))}
        style={styles.headerFontButton}
      >
        <Text style={[styles.headerFontText, { color: Colors.textPrimary }]}>A-</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setFontScale(prev => Math.min(1.5, prev + 0.1))}
        style={styles.headerFontButtonLarge}
      >
        <Text style={[styles.headerFontText, { color: Colors.textPrimary }]}>A+</Text>
      </TouchableOpacity>
      <SettingsButton />
    </View>
  ), [setFontScale]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: HeaderRightActions,
    });
  }, [navigation, HeaderRightActions]);

  const loadItems = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = getAllItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items', err);
      Alert.alert('Error', 'Failed to load inventory');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Move the ItemRow component outside as a separate component
  const ItemRow = React.useCallback(({ item }: { item: Item }) => {
    const getQuantityColor = (row: Item) => {
      // const qtyLeft = Number(row.quantity_left);
      const qty = Number(row.quantity);
      const threshold = Number(row.low_stock_threshold);
      //   const res = getDB().execute(
      //   `SELECT id, quantity_left, low_stock_threshold FROM items`
      // );
      // console.log(res.rows?._array);

      if (qty === null || qty === undefined) {
        return Colors.error;
      }
      const isLowOrOut =
        !Number.isNaN(qty) &&
        (qty === 0 || (!Number.isNaN(threshold) && qty <= threshold));

      const quantityColor = isLowOrOut
        ? Colors.stockLow
        : Colors.stockGood;
      return quantityColor;
    };

    const quantityColor = getQuantityColor(item);
    const isLowOrOut = item.quantity_left !== null && 
                      item.quantity_left !== undefined && 
                      (item.quantity_left === 0 || item.quantity_left <= item.low_stock_threshold);

    return (
      <TouchableOpacity
        // onPress={() => handleItemPress(item.id)}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}

        style={styles.itemRow}
      >
        <View style={styles.itemContent}>
          <Text 
            style={[
              styles.itemName, 
              {  color: quantityColor, fontSize: Typography.fontSize.md * fontScale }
            ]} 
            numberOfLines={1}
          >
            {item.name}
          </Text>
          
          {item.quantity_left !== null && item.quantity_left !== undefined ? (
            <Text 
              style={[
                styles.quantityInline,
                { color: quantityColor, fontSize: Typography.fontSize.sm * fontScale }
              ]}
            >
             qt • {item.quantity_left}
            </Text>
          ) : null}
        </View>

        <View style={styles.itemRight}>
          <Text 
            style={[
              styles.itemPrice, 
              { color: quantityColor,fontSize: Typography.fontSize.md * fontScale }
            ]}
          >
            ₹{item.sell_price || 0}
          </Text>
          
          {isLowOrOut && (
            <MaterialCommunityIcons
              name="alert-circle"
              size={14 * fontScale}
              color={Colors.error}
              style={styles.lowStockIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [fontScale, navigation]); // Add dependencies here

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const groupedItems = useMemo(() => {
    if (!showAlphaIndex) return [];

    const map: Record<string, Item[]> = {};
    filteredItems.forEach(item => {
      const firstChar = item.name.charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
      if (!map[letter]) map[letter] = [];
      map[letter].push(item);
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, items]) => ({
        letter,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [filteredItems, showAlphaIndex]);

  const renderItem = ({ item }: { item: Item }) => <ItemRow item={item} />;

  const SectionHeader = React.useCallback(({ letter }: { letter: string }) => (
    <Text style={[styles.sectionHeader, { fontSize: Typography.fontSize.lg * fontScale }]}>
      {letter}
    </Text>
  ), [fontScale]);

  const renderSectionItem = ({ item }: { item: { letter: string, items: Item[] } }) => (
    <View style={styles.section}>
      <SectionHeader letter={item.letter} />
      {item.items.map(i => (
        <ItemRow key={i.id} item={i} />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AddItemForm onItemAdded={loadItems} />

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search items..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { fontSize: Typography.fontSize.md * fontScale }]}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerText, { fontSize: Typography.fontSize.xl * fontScale }]}>
            Inventory
          </Text>
          <Text style={[styles.countText, { fontSize: Typography.fontSize.sm * fontScale }]}>
            {filteredItems.length} items
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={[styles.alphaLabel, { fontSize: Typography.fontSize.sm * fontScale }]}>
            A-Z Index
          </Text>
          <Switch
            value={showAlphaIndex}
            onValueChange={setShowAlphaIndex}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.surface}
          />
        </View>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="package-variant"
            size={48 * fontScale}
            color={Colors.textLight}
          />
          <Text style={[styles.emptyText, { fontSize: Typography.fontSize.lg * fontScale }]}>
            {searchQuery ? 'No items found' : 'No items in inventory'}
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: Typography.fontSize.md * fontScale }]}>
            {searchQuery ? 'Try a different search' : 'Add items to get started'}
          </Text>
        </View>
      ) : showAlphaIndex ? (
        <FlatList
          data={groupedItems}
          keyExtractor={({ letter }) => `section-${letter}`}
          renderItem={renderSectionItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerFontButton: {
    marginRight: Spacing.sm,
  },
  headerFontButtonLarge: {
    marginRight: Spacing.lg,
  },
  headerFontText: {
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  countText: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  alphaLabel: {
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  emptySubtext: {
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemName: {
    color: Colors.textPrimary,
    fontFamily: 'Lora-Bold',
    fontWeight: '500',
    flexShrink: 0,
  },
  quantityInline: {
    fontWeight: '500',
    flexShrink: 0,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemPrice: {
    // color: '#3B82F6',
    fontWeight: '600',
  },
  lowStockIcon: {
    marginLeft: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
});

export default InventoryListScreen;
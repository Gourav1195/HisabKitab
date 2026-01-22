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
    const getQuantityStyle = (row: Item) => {
      const qty = Number(row.quantity_left);
      // const qty = Number(row.quantity);
      const threshold = Number(row.low_stock_threshold);

      if (Number.isNaN(qty)) {
        return { color: Colors.stockOk, badge: null };
      }

      if (qty === 0) {
        return { color: Colors.stockOut, badge: 'OUT' };
      }

      if (!Number.isNaN(threshold) && qty <= threshold) {
        return { color: Colors.stockLow, badge: 'LOW' };
      }


      return { color: Colors.stockOk, badge: null };
    };
    const status = getQuantityStyle(item);

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
              { fontSize: Typography.fontSize.md * fontScale }
            ]}
          >
            {item.name}
          </Text>

          {item.quantity_left !== null && item.quantity_left !== undefined ? (
            <Text
              style={[
                styles.quantityInline,
                { color: status.color, fontSize: Typography.fontSize.sm * fontScale }
              ]}
            >
              • {item.quantity_left}
            </Text>
          ) : <Text
            style={[
              styles.quantityInline,
              { color: status.color, fontSize: Typography.fontSize.sm * fontScale }
            ]}
          >
            qt • 0
          </Text>}
        </View>

        <View style={styles.itemRight}>
          <Text
            style={[
              styles.quantityInline,
              { color: status.color, fontSize: Typography.fontSize.sm * fontScale }
            ]}
          >
            ₹{item.sell_price || 0}
          </Text>

          {/* {isLowOrOut && (
            <MaterialCommunityIcons
              name="alert-circle"
              size={14 * fontScale}
              color={Colors.error}
              style={styles.lowStockIcon}
            />
          )} */}
          {status.badge && (
            <View style={[
              styles.stockBadge,
              status.badge === 'LOW' ? styles.lowBadge : styles.outBadge
            ]}>
              <Text style={styles.stockBadgeText}>
                {status.badge}
              </Text>
            </View>
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

      {/* ADD ITEM SECTION */}
      <View style={styles.addSection}>
        {/* <Text style={styles.sectionTitle}>Add Item</Text> */}
        <AddItemForm onItemAdded={loadItems} />
      </View>

      {/* DIVIDER */}
      {/* <View style={styles.sectionDivider} /> */}

      {/* BROWSE / SEARCH SECTION */}
      <View style={styles.browseSection}>
        {/* <Text style={styles.sectionTitleMuted}>Browse Inventory</Text> */}

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search items..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              { fontSize: Typography.fontSize.md * fontScale }
            ]}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[
              styles.headerText,
              { fontSize: Typography.fontSize.xl * fontScale }
            ]}>
              Item List
            </Text>
            <Text style={[
              styles.countText,
              { fontSize: Typography.fontSize.sm * fontScale }
            ]}>
              {filteredItems.length} items
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={[
              styles.alphaLabel,
              { fontSize: Typography.fontSize.sm * fontScale }
            ]}>
              A–Z Index
            </Text>
            <Switch
              value={showAlphaIndex}
              onValueChange={setShowAlphaIndex}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
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
    height: 44,
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
    paddingVertical: Spacing.md,
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
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.2,
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
    color: Colors.textSecondary,
    letterSpacing: 1,
    opacity: 0.8,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: Spacing.sm,
  },
  lowBadge: {
    backgroundColor: Colors.stockLow + '20',
  },
  outBadge: {
    backgroundColor: Colors.stockOut + '20',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  },
  addSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  browseSection: {
    backgroundColor: Colors.background,
  },

  sectionDivider: {
    height: 8,
    backgroundColor: Colors.borderLight,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },

  sectionTitleMuted: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,

  },

});

export default InventoryListScreen;
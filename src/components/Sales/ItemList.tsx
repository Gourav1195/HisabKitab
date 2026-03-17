import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item } from '../../types/inventory';
import { Colors, Spacing, Typography, BorderRadius, getScaledFontSize } from '../../theme/Colors';
import { useUISettings } from '../../ui/UISettingsContext';

interface ItemListProps {
  items: Item[];
  onAddItem: (item: Item) => void;
  showAlphaIndex: boolean;
  cartHeight: number;
}

interface ItemRowProps { 
  item: Item; 
  onPress: () => void;
  fontScale: number;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onPress, fontScale }) => {
  const scaledSm = getScaledFontSize(Typography.fontSize.sm, fontScale);
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  
  const isOutOfStock = item.quantity_left !== null && item.quantity_left === 0;
  const hasPrice = item.sell_price > 0;
  
  return (
    <TouchableOpacity 
      style={[styles.row, isOutOfStock && styles.rowDisabled]} 
      onPress={onPress}
      activeOpacity={isOutOfStock ? 0.5 : 0.7}
      disabled={isOutOfStock}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.itemName, { fontSize: scaledMd }, isOutOfStock && styles.itemNameOutOfStock]} numberOfLines={1}>
          {item.name}
        </Text>
        {isOutOfStock && <Text style={[styles.outOfStockLabel, { fontSize: scaledSm }]}>Out of stock</Text>}
      </View>
      
      <View style={styles.priceContainer}>
        {hasPrice ? (
          <Text style={[styles.itemPrice, { fontSize: scaledMd }, isOutOfStock && styles.itemPriceOutOfStock]}>
            ₹{item.sell_price}
          </Text>
        ) : (
          <View style={styles.priceMissingContainer}>
            <MaterialCommunityIcons name="tag-off-outline" size={12 * fontScale} color={Colors.warning} />
            <Text style={[styles.priceMissing, { fontSize: scaledSm }]}>Set price</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ItemList: React.FC<ItemListProps> = ({ items, onAddItem, showAlphaIndex, cartHeight }) => {
  const { fontScale } = useUISettings();
  
  const scaledSm = getScaledFontSize(Typography.fontSize.sm, fontScale);
  
  const filteredItems = items.filter(i => i.quantity_left !== null && i.quantity_left !== undefined);

  const groupedItems = React.useMemo(() => {
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
      .map(([letter, items]) => ({ letter, items: items.sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [filteredItems, showAlphaIndex]);

  const contentContainerStyle = { paddingBottom: cartHeight + Spacing.xl };

  if (!showAlphaIndex) {
    return (
      <FlatList
        data={filteredItems}
        keyExtractor={item => `item-${item.id}`}
        renderItem={({ item }) => <ItemRow item={item} onPress={() => onAddItem(item)} fontScale={fontScale} />}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  }

  return (
    <FlatList
      data={groupedItems}
      keyExtractor={({ letter }) => `section-${letter}`}
      renderItem={({ item: { letter, items } }) => (
        <View>
          <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeader, { fontSize: scaledSm }]}>{letter}</Text>
          </View>
          {items.map(i => (
            <ItemRow key={`item-${i.id}`} item={i} onPress={() => onAddItem(i)} fontScale={fontScale} />
          ))}
        </View>
      )}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface },
  rowDisabled: { opacity: 0.5, backgroundColor: Colors.background },
  rowContent: { flex: 1, marginRight: Spacing.md },
  itemName: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold, letterSpacing: 0.2 },
  itemNameOutOfStock: { color: Colors.textLight },
  outOfStockLabel: { color: Colors.error, fontWeight: Typography.fontWeight.medium, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end', minWidth: 60 },
  itemPrice: { color: Colors.primary, fontWeight: Typography.fontWeight.bold },
  itemPriceOutOfStock: { color: Colors.textLight },
  priceMissingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceMissing: { color: Colors.warning, fontWeight: Typography.fontWeight.medium },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.lg },
  sectionHeaderContainer: { backgroundColor: Colors.background, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  sectionHeader: { fontWeight: Typography.fontWeight.bold, color: Colors.textSecondary, letterSpacing: 0.5 },
});

export default ItemList;
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Item } from '../../types/inventory';
import { Colors, Spacing, Typography,  } from '../../theme/Colors';

interface ItemListProps {
  items: Item[];
  onAddItem: (item: Item) => void;
  showAlphaIndex: boolean;
  cartHeight: number;
}

const ItemRow: React.FC<{ item: Item; onPress: () => void }> = ({ 
  item, 
  onPress 
}) => {
  const isOutOfStock = item.quantity_left !== null && item.quantity_left === 0;
  
  return (
    <>
   
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress}
      // disabled={isOutOfStock}
    >
      <View style={styles.rowContent}>
        <Text style={[
          styles.itemName,
          isOutOfStock && styles.itemNameOutOfStock
        ]}>
          {item.name}
        </Text>
      </View>
      
      <View style={styles.priceContainer}>
        {item.sell_price > 0 ? (
          <Text style={[
            styles.itemPrice,
            isOutOfStock && styles.itemPriceOutOfStock
          ]}>
            ₹{item.sell_price}
          </Text>
        ) : (
          <Text style={styles.priceMissing}>Set price</Text>
        )}
      </View>
    </TouchableOpacity>
  
    </>
  );
};

const ItemList: React.FC<ItemListProps> = ({ 
  items, 
  onAddItem,
  showAlphaIndex,
  cartHeight
}) => {
  const filteredItems = items.filter(i =>
  i.quantity_left !== null &&
  i.quantity_left !== undefined 
  //  && i.quantity_left > 0
);

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
      .map(([letter, items]) => ({
        letter,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [filteredItems, showAlphaIndex]);

  const contentContainerStyle = {
    paddingBottom: cartHeight + Spacing.lg,
  };

  if (!showAlphaIndex) {
    return (
      <FlatList
        data={filteredItems}
        keyExtractor={item => `item-${item.id}`}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onPress={() => onAddItem(item)}
          />
        )}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={groupedItems}
      keyExtractor={({ letter }) => `section-${letter}`}
      renderItem={({ item: { letter, items } }) => (
        <View>
          <Text style={styles.sectionHeader}>{letter}</Text>
          {items.map(i => (
            <ItemRow
              key={`item-${i.id}`}
              item={i}
              onPress={() => onAddItem(i)}
            />
          ))}
        </View>
      )}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  rowContent: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.2,
  },
  itemNameOutOfStock: {
    color: Colors.textLight,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  itemPrice: {
    fontSize: Typography.fontSize.md,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  itemPriceOutOfStock: {
    color: Colors.textLight,
  },
  priceMissing: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
});

export default ItemList;
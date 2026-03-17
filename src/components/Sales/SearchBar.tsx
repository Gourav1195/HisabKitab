import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography, BorderRadius, getScaledFontSize } from '../../theme/Colors';
import { useUISettings } from '../../ui/UISettingsContext';

interface SearchBarProps {
  query: string;
  onChangeText: (text: string) => void;
  onQuickAdd: () => void;
  showQuickAdd: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onChangeText, onQuickAdd, showQuickAdd }) => {
  const { fontScale } = useUISettings();
  
  const scaledSm = getScaledFontSize(Typography.fontSize.sm, fontScale);
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  const hasQuery = query.trim().length > 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20 * fontScale} color={hasQuery ? Colors.primary : Colors.textLight} style={styles.searchIcon} />
        <TextInput
          placeholder="Search or add new item"
          placeholderTextColor={Colors.textLight}
          value={query}
          onChangeText={onChangeText}
          style={[styles.searchInput, { fontSize: scaledMd }, hasQuery && styles.searchInputActive]}
          returnKeyType="search"
        />
        {hasQuery && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={18 * fontScale} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      
      {showQuickAdd && (
        <TouchableOpacity style={styles.quickAddButton} onPress={onQuickAdd} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus-circle-outline" size={14 * fontScale} color={Colors.primary} />
          <Text style={[styles.quickAddText, { fontSize: scaledSm }]}>Add "{query.trim()}" as new item</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, backgroundColor: Colors.background },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, color: Colors.textPrimary, padding: 0, includeFontPadding: false },
  searchInputActive: { borderColor: Colors.primary },
  quickAddButton: { marginTop: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md, backgroundColor: Colors.primary + '12', borderRadius: BorderRadius.md, gap: Spacing.xs },
  quickAddText: { color: Colors.primary, fontWeight: Typography.fontWeight.medium },
});

export default SearchBar;
import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/Colors';

interface SearchBarProps {
  query: string;
  onChangeText: (text: string) => void;
  onQuickAdd: () => void;
  showQuickAdd: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  query, 
  onChangeText, 
  onQuickAdd, 
  showQuickAdd 
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search or Add New Item"
        placeholderTextColor={Colors.textLight}
        value={query}
        onChangeText={onChangeText}
        style={styles.searchInput}
      />
      
      {showQuickAdd && query.trim() && (
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={onQuickAdd}
        >
          <Text style={styles.quickAddText}>
            + Add "{query}"
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  quickAddButton: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});

export default SearchBar;
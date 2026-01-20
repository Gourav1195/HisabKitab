import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDB } from '../../db';

interface AddItemFormProps {
  onItemAdded: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onItemAdded }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter item name');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Required', 'Please enter price');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    if (priceNum > 1000000) {
      Alert.alert('Price Too High', 'Maximum price is ₹10,00,000');
      return;
    }

    setIsAdding(true);

    try {
      const db = getDB();
      const now = Date.now();

      console.log('Inserting item:', {
        name: name.trim(),
        sell_price: priceNum,
        now
      });

      // Fixed INSERT statement - removed extra column
      const result = db.execute(
        `INSERT INTO items 
         (name, sell_price, quantity, quantity_left, created_at, updated_at, low_stock_threshold)
         VALUES (?, ?, 0, 0, ?, ?, 5)`,
        [name.trim(), priceNum, now, now]
      );

      console.log('Insert result:', result);

      // Check if insertion was successful
      if (result.rowsAffected > 0 || result.insertId) {
        // Reset form
        setName('');
        setPrice('');
        
        // Notify parent to refresh
        onItemAdded();
        
        Alert.alert('Success', 'Item added successfully');
      } else {
        throw new Error('Insert failed - no rows affected');
      }
    } catch (error: any) {
      console.error('Failed to add item:', error);
      Alert.alert('Error', `Failed to add item: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formRow}>
        <TextInput
          placeholder="Item name"
          placeholderTextColor={Colors.textLight}
          value={name}
          onChangeText={setName}
          style={[styles.input, styles.nameInput]}
          maxLength={50}
          returnKeyType="next"
        />
        
        <TextInput
          placeholder="₹ Price"
          placeholderTextColor={Colors.textLight}
          value={price}
          onChangeText={setPrice}
          style={[styles.input, styles.priceInput]}
          keyboardType="decimal-pad"
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={handleAddItem}
        />
        
        <TouchableOpacity
          style={[
            styles.addButton,
            (!name.trim() || !price.trim() || isAdding) && styles.addButtonDisabled
          ]}
          onPress={handleAddItem}
          disabled={!name.trim() || !price.trim() || isAdding}
        >
          {isAdding ? (
            <Text style={styles.addButtonText}>...</Text>
          ) : (
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={Colors.textInverse}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  nameInput: {
    flex: 2,
  },
  priceInput: {
    flex: 1,
    textAlign: 'right',
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  addButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
});

export default AddItemForm;
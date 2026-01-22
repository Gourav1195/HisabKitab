import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
  Animated,
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

  const nameScale = useRef(new Animated.Value(1)).current;
  const priceScale = useRef(new Animated.Value(1)).current;

  const animateIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1.03,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  const animateOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  const handleAddItem = async () => {
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

    setIsAdding(true);

    try {
      const db = getDB();
      const now = Date.now();

      const result = db.execute(
        `INSERT INTO items
         (name, sell_price, quantity, quantity_left, created_at, updated_at, low_stock_threshold)
         VALUES (?, ?, 0, 0, ?, ?, 5)`,
        [name.trim(), priceNum, now, now]
      );

      if (result.rowsAffected > 0 || result.insertId) {
        setName('');
        setPrice('');
        onItemAdded();
      } else {
        throw new Error('Insert failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add item');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Add Item</Text>

      <View style={styles.container}>
        <View style={styles.formRow}>
          <Animated.View style={{ flex: 2, transform: [{ scale: nameScale }] }}>
            <TextInput
              placeholder="Item name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              style={[styles.input, styles.nameInput]}
              maxLength={50}
              returnKeyType="next"
              onFocus={() => animateIn(nameScale)}
              onBlur={() => animateOut(nameScale)}
            />
          </Animated.View>

          <Animated.View style={{ flex: 1, transform: [{ scale: priceScale }] }}>
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
              onFocus={() => animateIn(priceScale)}
              onBlur={() => animateOut(priceScale)}
            />
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.addButton,
              (!name.trim() || !price.trim() || isAdding) && styles.addButtonDisabled,
            ]}
            onPress={handleAddItem}
            disabled={!name.trim() || !price.trim() || isAdding}
            activeOpacity={0.85}
          >
            {isAdding ? (
              <Text style={styles.addButtonText}>…</Text>
            ) : (
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={Colors.textInverse}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg, // 👈 makes it feel like a section
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },

  container: {
    backgroundColor: Colors.surface,
  },

  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  input: {
    height: 44, // 👈 taller = less cramped
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
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
    width: 44,   // 👈 matches input height
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonDisabled: {
    backgroundColor: Colors.border,
  },

  addButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
});


export default AddItemForm;
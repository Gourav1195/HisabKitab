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

  const nameBorder = useRef(new Animated.Value(0)).current;
  const priceBorder = useRef(new Animated.Value(0)).current;

  const focusField = (anim: Animated.Value) =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();

  const blurField = (anim: Animated.Value) =>
    Animated.timing(anim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();

  const interpolateBorder = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.border, Colors.primary],
    });

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
        `INSERT INTO items (name, sell_price, quantity, quantity_left, created_at, updated_at, low_stock_threshold)
         VALUES (?, ?, 0, 0, ?, ?, 5)`,
        [name.trim(), priceNum, now, now],
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

  const canSubmit =
    name.trim().length > 0 && price.trim().length > 0 && !isAdding;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>ADD ITEM</Text>
      <View style={styles.formRow}>
        <Animated.View
          style={[
            styles.inputWrap,
            styles.nameWrap,
            { borderColor: interpolateBorder(nameBorder) },
          ]}
        >
          <TextInput
            placeholder="Item name"
            placeholderTextColor={Colors.textLight}
            value={name}
            onChangeText={setName}
            style={styles.input}
            maxLength={50}
            returnKeyType="next"
            onFocus={() => focusField(nameBorder)}
            onBlur={() => blurField(nameBorder)}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.inputWrap,
            styles.priceWrap,
            { borderColor: interpolateBorder(priceBorder) },
          ]}
        >
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            placeholder="Price"
            placeholderTextColor={Colors.textLight}
            value={price}
            onChangeText={setPrice}
            style={[styles.input, styles.priceInput]}
            keyboardType="decimal-pad"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleAddItem}
            onFocus={() => focusField(priceBorder)}
            onBlur={() => blurField(priceBorder)}
          />
        </Animated.View>

        <TouchableOpacity
          style={[styles.addButton, !canSubmit && styles.addButtonDisabled]}
          onPress={handleAddItem}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {isAdding ? (
            <Text style={styles.addButtonDot}>…</Text>
          ) : (
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={Colors.textInverse}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textLight,
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },

  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },

  nameWrap: {
    flex: 2,
  },

  priceWrap: {
    flex: 1,
  },

  currencySymbol: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },

  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    height: 46,
    padding: 0,
  },

  priceInput: {
    textAlign: 'right',
  },

  addButton: {
    width: 46,
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonDisabled: {
    backgroundColor: Colors.border,
  },

  addButtonDot: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default AddItemForm;

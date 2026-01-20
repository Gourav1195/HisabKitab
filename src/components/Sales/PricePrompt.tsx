import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { Item } from '../../types/inventory';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/Colors';

type Props = {
  visible: boolean;
  mode: 'existing' | 'new';
  item: Item | null;
  price: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: (price: number) => void;
};

const PricePrompt: React.FC<Props> = ({
  visible,
  mode,
  item,
  price,
  onChange,
  onCancel,
  onConfirm,
}) => {
  if (!item) return null;

  const handleConfirm = () => {
    const priceNum = parseFloat(price);
    
    if (!price.trim()) {
      Alert.alert('Enter price');
      return;
    }
    
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid price');
      return;
    }
    
    onConfirm(priceNum);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {mode === 'existing' ? 'Set price for' : 'Add new item:'}
          </Text>
          <Text style={styles.itemName}>{item.name}</Text>
          
          <TextInput
            keyboardType="decimal-pad"
            value={price}
            onChangeText={onChange}
            placeholder="Price"
            style={styles.input}
            autoFocus
          />
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {mode === 'existing' ? 'Add' : 'Add & Sell'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  itemName: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: Spacing.lg,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.surface,
    fontWeight: '500',
  },
});

export default PricePrompt;
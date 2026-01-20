// components/Sales/CartBar.tsx - Updated
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { CartItem } from '../../types/inventory';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CartBarProps {
  cart: Record<number, CartItem>;
  total: number;
  onUpdateQty: (id: number, delta: number) => void;
  onEditPrice: (item: CartItem) => void;
  onCompleteSale: () => void;
  onLayout: (height: number) => void;
  isCredit: boolean;
  customerName?: string;
}

const CartBar: React.FC<CartBarProps> = ({
  cart,
  total,
  onUpdateQty,
  onEditPrice,
  onCompleteSale,
  onLayout,
  isCredit,
  customerName
}) => {
  const cartItems = Object.values(cart);
  
  return (
    <View 
      style={[
        styles.container,
        isCredit ? styles.creditContainer : styles.cashContainer
      ]}
      onLayout={e => onLayout(e.nativeEvent.layout.height)}
    >
      <View style={styles.header}>
        <Text style={styles.total}>
          Total: <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
        </Text>
        
        {isCredit && customerName && (
          <View style={styles.creditInfo}>
            <MaterialCommunityIcons 
              name="credit-card-outline" 
              size={16} 
              color={Colors.error} 
            />
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
        )}
      </View>
      
      {cartItems.length > 0 && (
        <>
          {cartItems.map(item => (
            <View key={`cart-${item.id}`} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <TouchableOpacity onPress={() => onEditPrice(item)}>
                  <Text style={styles.cartItemPrice}>₹{item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => onUpdateQty(item.id, -1)}
                >
                  <Text style={styles.qtyButtonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantity}>{item.qty}</Text>
                
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => onUpdateQty(item.id, 1)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          <TouchableOpacity
            style={[
              styles.completeButton,
              cartItems.length === 0 && styles.completeButtonDisabled,
              isCredit && styles.creditButton
            ]}
            onPress={onCompleteSale}
            disabled={cartItems.length === 0}
          >
            <MaterialCommunityIcons
              name={isCredit ? "credit-card" : "cash"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.completeButtonText}>
              {isCredit ? 'Complete Credit Sale' : 'Complete Cash Sale'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    padding: Spacing.md,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  cashContainer: {
    backgroundColor: '#E8F5E9', // Light green
    borderColor: '#C8E6C9',
  },
  creditContainer: {
    backgroundColor: '#FFEBEE', // Light red
    borderColor: '#FFCDD2',
  },
  header: {
    marginBottom: Spacing.sm,
  },
  total: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  totalAmount: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  customerName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cartItemInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemName: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  cartItemPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  qtyButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  quantity: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.sm,
    minWidth: 24,
    textAlign: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  creditButton: {
    backgroundColor: Colors.error, // Red for credit sales
  },
  completeButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  completeButtonText: {
    fontSize: Typography.fontSize.md,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default CartBar;
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartItem } from '../../types/inventory';
import {
  Colors, Spacing, Typography, BorderRadius, getScaledFontSize,
} from '../../theme/Colors';
import { useUISettings } from '../../ui/UISettingsContext';

interface CartBarProps {
  cart: Record<number, CartItem>;
  total: number;
  onUpdateQty: (id: number, delta: number) => void;
  onEditPrice: (item: CartItem) => void;
  onCompleteSale: () => void;
  onClearCart: () => void;
  onLayout: (height: number) => void;
  isCredit: boolean;
  customerName?: string;
}

const CartBar: React.FC<CartBarProps> = ({
  cart, total, onUpdateQty, onEditPrice,
  onCompleteSale, onClearCart, onLayout, isCredit, customerName,
}) => {
  const { fontScale } = useUISettings();

  const cartItems   = Object.values(cart);
  const isEmpty     = cartItems.length === 0;
  const accent      = isCredit ? Colors.stockLow : Colors.primary;

  const scaledXs = getScaledFontSize(Typography.fontSize.xs, fontScale);
  const scaledSm = getScaledFontSize(Typography.fontSize.sm, fontScale);
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  const scaledLg = getScaledFontSize(Typography.fontSize.lg, fontScale);

  return (
    <View
      style={[styles.container, { borderTopColor: accent + '40' }]}
      onLayout={e => onLayout(e.nativeEvent.layout.height)}
    >
      {/* ── Summary header ──────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        {/* Left: Clear button + Cart status */}
        <View style={styles.summaryLeft}>
          <View style={styles.clearAndStatusRow}>
            {/* Clear All Button */}
            {!isEmpty && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={onClearCart}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={14 * fontScale}
                  color={Colors.error}
                />
                <Text style={[styles.clearBtnText, { fontSize: scaledXs }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Cart status */}
            <View style={styles.statusRow}>
              <MaterialCommunityIcons 
                name={isEmpty ? 'cart-outline' : 'cart'} 
                size={14 * fontScale} 
                color={isEmpty ? Colors.textLight : accent} 
              />
              <Text style={[styles.summaryLabel, { fontSize: scaledXs }]} numberOfLines={1}>
                {isEmpty
                  ? 'Cart is empty — tap items to add'
                  : `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in cart`}
              </Text>
            </View>
          </View>
          
          {/* Customer chip — only in credit mode */}
          {isCredit && customerName ? (
            <View style={[styles.customerChip, { backgroundColor: Colors.stockLow + '12' }]}>
              <MaterialCommunityIcons name="account-outline" size={12 * fontScale} color={Colors.stockLow} />
              <Text style={[styles.customerChipText, { fontSize: scaledXs }]} numberOfLines={1}>
                {customerName}
              </Text>
            </View>
          ) : null}
        </View>
        
        {/* Right: Total */}
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { fontSize: scaledXs }]}>Total</Text>
          <Text style={[styles.totalText, { fontSize: scaledLg, color: accent }]}>
            ₹{total.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* ── Cart item rows ───────────────────────────────────────── */}
      {!isEmpty && (
        <>
          <ScrollView
            style={styles.itemList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {cartItems.map((item, idx) => (
              <View
                key={`cart-${item.id}`}
                style={[
                  styles.itemRow,
                  idx < cartItems.length - 1 && styles.itemRowBorder,
                ]}
              >
                {/* Left: name + price (tap to edit) */}
                <TouchableOpacity
                  style={styles.itemInfo}
                  onPress={() => onEditPrice(item)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.itemName, { fontSize: scaledSm }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.priceHint}>
                    <Text style={[styles.itemPrice, { fontSize: scaledXs, color: accent }]}>
                      ₹{item.price}
                    </Text>
                    <MaterialCommunityIcons name="pencil-outline" size={10 * fontScale} color={Colors.textLight} />
                  </View>
                </TouchableOpacity>

                {/* Right: stepper + line total */}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: item.qty === 1 ? Colors.error : Colors.border }]}
                    onPress={() => onUpdateQty(item.id, -1)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name={item.qty === 1 ? 'trash-can-outline' : 'minus'}
                      size={13 * fontScale}
                      color={item.qty === 1 ? Colors.error : Colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <Text style={[styles.qtyNum, { fontSize: scaledMd }]}>{item.qty}</Text>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => onUpdateQty(item.id, 1)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="plus" size={13 * fontScale} color={Colors.textSecondary} />
                  </TouchableOpacity>

                  <Text style={[styles.lineTotal, { fontSize: scaledXs }]}>
                    ₹{(item.qty * item.price).toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* ── Complete button ──────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: accent }]}
            onPress={onCompleteSale}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={isCredit ? 'account-clock-outline' : 'check-circle-outline'}
              size={17 * fontScale}
              color={Colors.textInverse}
            />
            <Text style={[styles.completeBtnText, { fontSize: scaledMd }]}>
              {isCredit ? 'Record Credit' : 'Complete Sale'}
            </Text>
            <View style={styles.completeBtnDivider} />
            <Text style={[styles.completeBtnTotal, { fontSize: scaledMd }]}>
              ₹{total.toFixed(0)}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 2,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  /* ── Summary row ──────────────────────────────────────────────────── */
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  summaryLeft: {
    flex: 1,
    marginRight: Spacing.lg,
    gap: Spacing.xs,
  },

  clearAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error + '12',
    gap: 4,
  },

  clearBtnText: {
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xl,
    marginTop: 2,
  },

  customerChipText: {
    color: Colors.stockLow,
    fontWeight: Typography.fontWeight.semibold,
  },

  summaryLabel: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.medium,
  },

  totalContainer: {
    alignItems: 'flex-end',
  },

  totalLabel: {
    color: Colors.textLight,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },

  totalText: {
    fontWeight: Typography.fontWeight.bold,
  },

  /* ── Item list ────────────────────────────────────────────────────── */
  itemList: {
    maxHeight: 160,
    marginBottom: Spacing.md,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },

  itemRowBorder: {
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  priceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },

  itemPrice: {
    fontWeight: Typography.fontWeight.medium,
  },

  /* ── Stepper ──────────────────────────────────────────────────────── */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  stepBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },

  qtyNum: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    minWidth: 22,
    textAlign: 'center',
  },

  lineTotal: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    minWidth: 42,
    textAlign: 'right',
  },

  /* ── Complete button ──────────────────────────────────────────────── */
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    height: 50,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  completeBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semibold,
  },

  completeBtnDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  completeBtnTotal: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default CartBar;
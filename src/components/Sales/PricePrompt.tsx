import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Item } from '../../types/inventory';
import {
  Colors, Spacing, Typography, BorderRadius, Shadow, getScaledFontSize,
} from '../../theme/Colors';
import { useUISettings } from '../../ui/UISettingsContext';

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
  visible, mode, item, price, onChange, onCancel, onConfirm,
}) => {
  const { fontScale } = useUISettings();
  const translateY = useRef(new Animated.Value(320)).current;
  const overlayOp  = useRef(new Animated.Value(0)).current;

  const scaledXs = getScaledFontSize(Typography.fontSize.xs, fontScale);
  const scaledSm = getScaledFontSize(Typography.fontSize.sm, fontScale);
  const scaledMd = getScaledFontSize(Typography.fontSize.md, fontScale);
  const scaledLg = getScaledFontSize(Typography.fontSize.lg, fontScale);
  const scaledXl = getScaledFontSize(Typography.fontSize.xl, fontScale);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0, useNativeDriver: true, friction: 9, tension: 80,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOp, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 320, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOp, translateY]);

  if (!item) return null;

  const handleConfirm = () => {
    const trimmed  = price.trim();
    const num      = parseFloat(trimmed);
    if (!trimmed || isNaN(num) || num <= 0) { onChange(''); return; }
    onConfirm(num);
  };

  const isNew      = mode === 'new';
  const hasPrice   = (() => {
    const n = parseFloat(price.trim());
    return price.trim().length > 0 && !isNaN(n) && n > 0;
  })();
  const accent = isNew ? Colors.secondary : Colors.primary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.overlay, { opacity: overlayOp }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />

          <View style={styles.topRow}>
            <View style={[styles.modeTag, { backgroundColor: accent + '18' }]}>
              <MaterialCommunityIcons
                name={isNew ? 'plus-circle-outline' : 'tag-outline'}
                size={12 * fontScale} color={accent}
              />
              <Text style={[styles.modeTagText, { fontSize: scaledXs, color: accent }]}>
                {isNew ? 'NEW ITEM' : 'SET PRICE'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={20 * fontScale} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.itemName, { fontSize: scaledXl }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.itemHint, { fontSize: scaledSm }]}>
            {isNew
              ? 'This item will be saved to your inventory'
              : 'Price will be saved for next time'}
          </Text>

          <View style={[
            styles.inputRow, 
            { 
              borderColor: hasPrice ? accent : Colors.border,
              backgroundColor: hasPrice ? accent + '0A' : Colors.background 
            }
          ]}>
            <Text style={[
              styles.rupeeSymbol, 
              { fontSize: scaledXl, color: hasPrice ? accent : Colors.textLight }
            ]}>
              ₹
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              value={price}
              onChangeText={v => onChange(v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
              placeholder="0"
              placeholderTextColor={Colors.textLight}
              style={[
                styles.priceInput,
                { fontSize: getScaledFontSize(32, fontScale), color: hasPrice ? Colors.textPrimary : Colors.textLight },
              ]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              selectTextOnFocus
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={[styles.cancelBtnText, { fontSize: scaledMd }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: hasPrice ? accent : Colors.border },
                !hasPrice && styles.btnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!hasPrice}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={isNew ? 'plus' : 'cart-plus'}
                size={16 * fontScale}
                color={hasPrice ? Colors.textInverse : Colors.textLight}
              />
              <Text style={[
                styles.confirmBtnText, 
                { fontSize: scaledMd, color: hasPrice ? Colors.textInverse : Colors.textLight }
              ]}>
                {isNew ? 'Add & Sell' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.44)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl + 8,
    borderTopRightRadius: BorderRadius.xl + 8,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 8,
    ...Shadow.md,
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  modeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.xl },
  modeTagText: { fontWeight: Typography.fontWeight.bold, letterSpacing: 0.5 },
  itemName: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.xs },
  itemHint: { color: Colors.textLight, marginBottom: Spacing.xl },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.xl, height: 68, marginBottom: Spacing.xl, gap: Spacing.sm },
  rupeeSymbol: { fontWeight: Typography.fontWeight.bold },
  priceInput: { flex: 1, fontWeight: Typography.fontWeight.bold, padding: 0, includeFontPadding: false },
  actions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  confirmBtn: { flex: 2, height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.lg, gap: Spacing.sm },
  btnDisabled: { opacity: 0.32 },
  confirmBtnText: { fontWeight: Typography.fontWeight.bold },
});

export default PricePrompt;
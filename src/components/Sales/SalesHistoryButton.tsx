import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography } from '../../theme/Colors';

const SellHeaderActions = () => {
  const navigation = useNavigation<any>();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // subtle khata pulse (only once, calm down)
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.08,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Khata */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.btn, styles.remindBtn]}
          onPress={() => navigation.navigate('CreditLedger')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="book-open-variant"
            size={16}
            color={Colors.error}
          />
          <Text style={styles.remindText}>Khata</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Sales History */}
      <TouchableOpacity
        style={[styles.btn, styles.payBtn]}
        onPress={() => navigation.navigate('SalesHistory')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="history"
          size={16}
          color={Colors.surface}
        />
        <Text style={styles.payText}>History</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SellHeaderActions;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },

  /** matches what you sent **/
  payBtn: {
    backgroundColor: Colors.success,
  },

  remindBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight + '12',
  },

  payText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
  },

  remindText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing } from '../theme/Colors';

interface SplashScreenProps {
  onDone: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const iconScale  = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Icon pops in
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // App name fades in
      Animated.timing(textOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      // Tagline fades in
      Animated.timing(subOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      // Hold briefly
      Animated.delay(600),
    ]).start(() => onDone());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, {
        opacity: iconOpacity,
        transform: [{ scale: iconScale }],
      }]}>
        <MaterialCommunityIcons name="notebook-outline" size={56} color={Colors.textInverse} />
      </Animated.View>

      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        HisabKitab
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: subOpacity }]}>
        Simple inventory for your shop
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 96, height: 96,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: Typography.fontSize.xxxl + 6,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textInverse,
    opacity: 0.6,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default SplashScreen;
// screens/SalesHistoryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SalesHistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sales history</Text>
    </View>
  );
};

export default SalesHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
  },
});

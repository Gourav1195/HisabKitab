// src/screens/ProScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { getDB } from '../db';

const ProScreen = () => {
  const upgradeFake = () => {
    const db = getDB();
    db.execute(`UPDATE profile SET is_pro = 1`);
    Alert.alert('Pro activated', 'You are now a Pro user');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upgrade to Pro</Text>

      <View style={styles.card}>
        <Text style={styles.item}>✓ CSV export</Text>
        <Text style={styles.item}>✓ Dashboard charts</Text>
        <Text style={styles.item}>✓ Advanced inventory</Text>
        <Text style={styles.item}>✓ Backup (coming)</Text>
      </View>

      <Text style={styles.price}>₹99 / year</Text>

      <Button title="Upgrade now" onPress={upgradeFake} />
    </View>
  );
};

export default ProScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '600' },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
    gap: 8,
  },
  item: { fontSize: 15 },
  price: { fontSize: 20, fontWeight: '600', marginTop: 8 },
});

// src/screens/ProScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProScreen = () => {
  // Paid plans must be sold through Google Play Billing. Until that is wired up,
  // this screen only announces Pro; it must never unlock it for free.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upgrade to Pro</Text>

      <View style={styles.card}>
        <Text style={styles.item}>✓ CSV export</Text>
        <Text style={styles.item}>✓ Dashboard charts</Text>
        <Text style={styles.item}>✓ Advanced inventory</Text>
        <Text style={styles.item}>✓ Backup (coming)</Text>
      </View>

      <Text style={styles.price}>Coming soon</Text>
      <Text style={styles.note}>All current features are free.</Text>
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
  note: { fontSize: 14, color: '#4B5563' },
});

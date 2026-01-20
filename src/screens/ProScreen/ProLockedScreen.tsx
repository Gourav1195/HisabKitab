import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const ProLockedScreen = ({ onUpgrade }: { onUpgrade: () => void }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Pro feature</Text>

      <Text style={styles.desc}>
        This feature is available for Pro users only.
      </Text>

      <View style={styles.list}>
        <Text>• Full CSV export</Text>
        <Text>• Sales history & analytics</Text>
        <Text>• Inventory health & charts</Text>
        <Text>• Backup & restore</Text>
      </View>

      <Button title="Upgrade to Pro" onPress={onUpgrade} />
    </View>
  );
};

export default ProLockedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  desc: {
    color: '#555',
    marginBottom: 16,
  },
  list: {
    marginBottom: 24,
    gap: 6,
  },
});

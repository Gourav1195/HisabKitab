import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  getTodaySalesSummary,
  getInventorySummary,
} from '../repo/dashboardRepo';

const DashboardScreen = () => {
  const [sales, setSales] = useState({ total: 0, count: 0 });
  const [inventory, setInventory] = useState({
    totalItems: 0,
    lowStock: 0,
  });

  useEffect(() => {
    setSales(getTodaySalesSummary());
    setInventory(getInventorySummary());
  }, []);

  return (
    <View style={styles.container}>
      <View>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 4 }}>Dashboard</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Today’s Sales</Text>
        <Text style={styles.value}>₹ {sales.total}</Text>
        <Text style={styles.sub}>{sales.count} sales</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Inventory</Text>
        <Text style={styles.value}>{inventory.totalItems} items</Text>
        <Text style={styles.sub}>
          {inventory.lowStock} low stock
        </Text>
      </View>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 4,
  },
  sub: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
});

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

import {
  getTodayStats,
  getWeeklyStats,
  getInventoryHealth,
  getLastSale,
  getLast7DaysSales,
  getTopItemsThisWeek,
  getBestSellerToday,
} from '../repo/dashboardRepo';
// import { isProUser } from '../repo/userRepo';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const [today, setToday] = useState({
    total: 0,
    count: 0,
    itemsSold: 0,
  });

  const [week, setWeek] = useState({
    total: 0,
    avgPerDay: 0,
  });

  const [inventory, setInventory] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [lastSale, setLastSale] = useState<{
    id: number;
    total: number;
    createdAt: number;
  } | null>(null);

  const [weeklySeries, setWeeklySeries] = useState<
    { day: string; total: number }[]
  >([]);

  const [bestToday, setBestToday] = useState<{
    id: number;
    name: string;
    quantity: number;
  } | null>(null);

  const [topWeek, setTopWeek] = useState<
    { id: number; name: string; quantity: number }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      setToday(getTodayStats());
      setWeek(getWeeklyStats());
      setInventory(getInventoryHealth());
      setLastSale(getLastSale());
      setWeeklySeries(getLast7DaysSales());
      setBestToday(getBestSellerToday());
      setTopWeek(getTopItemsThisWeek());
    }, [])
  );

  return (
    <ScrollView>
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {/* TODAY */}
      <View style={styles.card}>
        <Text style={styles.label}>Today</Text>
        <Text style={styles.value}>₹ {today.total}</Text>
        <Text style={styles.sub}>
          {today.count} sales • {today.itemsSold} items
        </Text>
      </View>

      {/* WEEK */}
      <View style={styles.card}>
        <Text style={styles.label}>This week</Text>
        <Text style={styles.value}>₹ {week.total}</Text>
        <Text style={styles.sub}>Avg ₹ {week.avgPerDay} / day</Text>
      </View>

      {/* SALES CHART */}
      {weeklySeries.length > 0
      // && isProUser()
      ? (
        <View style={styles.card}>
          <Text style={styles.label}>Last 7 days sales</Text>

          <LineChart
            data={{
              labels: weeklySeries.map(d => d.day),
              datasets: [
                {
                  data: weeklySeries.map(d => d.total),
                },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="₹ "
            chartConfig={{
              backgroundGradientFrom: '#f7f7f7',
              backgroundGradientTo: '#f7f7f7',
              color: () => '#007aff',
              labelColor: () => '#666',
              propsForDots: {
                r: '4',
              },
            }}
            bezier
            style={{ marginTop: 12 }}
          />
        </View>
      ): null}

      {/* INVENTORY */}
      <View style={styles.card}>
        <Text style={styles.label}>Inventory</Text>
        <Text style={styles.sub}>
          {inventory.totalItems} items • {inventory.lowStock} low •{' '}
          {inventory.outOfStock} out
        </Text>
      </View>

      {/* LAST SALE */}
      {lastSale && (
        <View style={styles.card}>
          <Text style={styles.label}>Last sale</Text>
          <Text style={styles.sub}>
            ₹ {lastSale.total} •{' '}
            {new Date(lastSale.createdAt).toLocaleString()}
          </Text>
        </View>
      )}

      {bestToday && (
        <View style={styles.card}>
          <Text style={styles.label}>Best seller today</Text>
          <Text style={styles.sub}>
            {bestToday.name} • {bestToday.quantity} sold
          </Text>
        </View>
      )}
      {topWeek.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>Top items this week</Text>

          {topWeek.map((i, idx) => (
            <Text key={i.id} style={styles.sub}>
              {idx + 1}. {i.name} • {i.quantity}
            </Text>
          ))}
        </View>
      )}

    </View>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    marginTop: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
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

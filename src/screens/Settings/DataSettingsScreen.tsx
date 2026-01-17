import React from 'react';
import { View, Button, Alert } from 'react-native';
import { exportItemsToCSV, exportSalesCSV } from '../../repo/exportRepo';

const DataSettingsScreen = () => {
  const handleInventory = async () => {
    try {
      const path = await exportItemsToCSV();
      Alert.alert(
        'Export successful',
        `File saved to:\n${path}`
      );
    } catch (err: any) {
      Alert.alert(
        'Export failed',
        err.message || 'Something went wrong'
      );
    }
  }

  const handleSales = async () => {
    try {
      const path = await exportSalesCSV();
      Alert.alert(
        'Export successful',
        `File saved to:\n${path}`
      );
    } catch (err: any) {
      Alert.alert(
        'Export failed',
        err.message || 'Something went wrong'
      );
    }
  }

  const handleFull = async () => {
    try {
      const itemsPath = await exportItemsToCSV();
      const salesPath = await exportSalesCSV();
      Alert.alert(
        'Full export successful',
        `Items file:\n${itemsPath}\n\nSales file:\n${salesPath}`
      );
    } catch (err: any) {
      Alert.alert(
        'Export failed',
        err.message || 'Something went wrong'
      );
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Button title="Export inventory CSV" onPress={handleInventory} />
      <Button title="Export sales CSV" onPress={handleSales} />
      <Button title="Full backup (CSV)" color="red" onPress={handleFull} />
    </View>
  );
};

export default DataSettingsScreen;

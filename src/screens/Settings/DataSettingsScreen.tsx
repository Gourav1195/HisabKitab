import React from 'react';
import { View, Button, Alert } from 'react-native';
import { exportItemsToCSV } from '../../utils/exportItemsToCSV';

const DataSettingsScreen = () => {
  const onExport = async () => {
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
  };

  return (
    <View style={{ padding: 16 }}>
      <Button title="Export items to CSV" onPress={onExport} />
    </View>
  );
};

export default DataSettingsScreen;

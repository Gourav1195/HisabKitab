import React
// , { useEffect } 
from 'react';
import { View, Button, Alert } from 'react-native';
import { exportItemsToCSV, exportSalesCSV } from '../../repo/exportRepo';
// import { isProUser } from '../../repo/userRepo';
// import { useNavigation } from '@react-navigation/native';
// import ProLockedScreen from '../ProScreen/ProLockedScreen';

const DataSettingsScreen = () => {
  // const navigation = useNavigation<any>();

  // useEffect(() => {
  //   if (!isProUser()) {
  //     navigation.replace('Pro'); 
  //   }
  // }, [navigation]);

  const handleInventory = async () => {
    try {
      const path = await exportItemsToCSV();
      Alert.alert('Export successful', `File saved to:\n${path}`);
    } catch (err: any) {
      Alert.alert('Export failed', err.message || 'Something went wrong');
    }
  };

  const handleSales = async () => {
    try {
      const path = await exportSalesCSV();
      Alert.alert('Export successful', `File saved to:\n${path}`);
    } catch (err: any) {
      Alert.alert('Export failed', err.message || 'Something went wrong');
    }
  };

  const handleFull = async () => {
    try {
      const itemsPath = await exportItemsToCSV();
      const salesPath = await exportSalesCSV();
      Alert.alert(
        'Full export successful',
        `Items:\n${itemsPath}\n\nSales:\n${salesPath}`
      );
    } catch (err: any) {
      Alert.alert('Export failed', err.message || 'Something went wrong');
    }
  };

  // Optional: render nothing while redirecting
  // if (!isProUser()) {
  //   return <ProLockedScreen onUpgrade={() => navigation.navigate('Pro')} />;
  // }


  return (
    <View style={{ padding: 16 }}>
      <Button title="Export inventory CSV" onPress={handleInventory} />
      <Button title="Export sales CSV" onPress={handleSales} />
      <Button title="Full backup (CSV)" color="red" onPress={handleFull} />
    </View>
  );
};

export default DataSettingsScreen;

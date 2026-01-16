import React from 'react';
import { View, Text,  StyleSheet } from 'react-native';

const DashboardScreen  = () => {
  

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DashboardScreen  </Text>
     
    </View>
  );
};
export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
});


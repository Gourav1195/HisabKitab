import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { initDB } from './src/db';
import BottomTabs from './src/navigation/BottomTabs';

const App = () => {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <BottomTabs />
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

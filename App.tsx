import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { initDB } from './src/db';
import  RootStack  from './src/navigation/RootStack';
import { Text, TextInput } from 'react-native';
import 'react-native-get-random-values';
import { runAutoBackupIfNeeded } from './src/backup/runAutoBackup';
// import 'react-native-gesture-handler';

const App = () => {
  useEffect(() => {
    initDB();
  }, []);
  useEffect(() => {
    runAutoBackupIfNeeded();
  }, []);

  
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}

(Text as any).defaultProps.style = {
  fontFamily: 'Lora-Regular',
};

(TextInput as any).defaultProps.style = {
  fontFamily: 'Lora-Regular',
};

  return (
    <View style={styles.container}>
      <NavigationContainer>
         <RootStack />
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

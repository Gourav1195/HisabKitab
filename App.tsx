import React, { useEffect, useState } from 'react';
// import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { initDB } from './src/db';
import  RootStack  from './src/navigation/RootStack';
import { Text, TextInput } from 'react-native';
import 'react-native-get-random-values';
import { runAutoBackupIfNeeded } from './src/backup/runAutoBackup';
import { UISettingsProvider } from './src/ui/UISettingsContext';
import SplashScreen from './src/components/SplashScreen';
// import 'react-native-gesture-handler';

const App = () => {
  useEffect(() => {
    initDB();
  }, []);
  useEffect(() => {
    runAutoBackupIfNeeded();
  }, []);

  const [showSplash, setShowSplash] = useState(true);

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

  if (showSplash) {
    return (
      <UISettingsProvider>
        <SplashScreen onDone={() => setShowSplash(false)} />
      </UISettingsProvider>
    );
  }
  
  return (
      <UISettingsProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </UISettingsProvider>
  );
};

export default App;

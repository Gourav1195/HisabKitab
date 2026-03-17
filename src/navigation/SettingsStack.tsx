import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import DataSettingsScreen from '../screens/Settings/DataSettingsScreen';
import AppInfoScreen from '../screens/Settings/AppInfoScreen';
import DangerZoneScreen from '../screens/Settings/DangerZoneScreen';
import ArchivedItemsScreen from '../screens/Settings/ArchivedItemScreen';
import ProScreen from '../screens/ProScreen';
import ProfileScreen from '../screens/Settings/ProfileScreen';
import BackupScreen from '../screens/Settings/BackupScreen';

const Stack = createNativeStackNavigator();

const SettingsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="DataSettings"
        component={DataSettingsScreen}
        options={{ title: 'Download Data' }}
      />
      <Stack.Screen
        name="AppInfo"
        component={AppInfoScreen}
        options={{ title: 'App Info' }}
      />
      <Stack.Screen
        name="DangerZone"
        component={DangerZoneScreen}
        options={{ title: 'Danger Zone' }}
      />
      <Stack.Screen
        name="ArchivedItems"
        component={ArchivedItemsScreen}
        options={{ title: 'Archived Items' }}
        />
        <Stack.Screen
        name="Pro"
        component={ProScreen}
        options={{ title: 'Upgrade' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Backup"
        component={BackupScreen}
        options={{ title: 'Backup & Restore' }}
      />

    </Stack.Navigator>
  );
};

export default SettingsStack;

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SettingsScreen from '../screens/SettingsScreen';
import InventoryStack from './InventoryStack';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      
      <Tab.Screen
        name="Inventory"
        component={InventoryStack}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />

    </Tab.Navigator>
  );
};

export default BottomTabs;

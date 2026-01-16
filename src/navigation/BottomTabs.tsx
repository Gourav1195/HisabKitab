import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SellScreen from '../screens/SellScreen';
import InventoryStack from './InventoryStack';
import DashboardScreen from '../screens/DashboardScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Sell"
        component={SellScreen}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryStack}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;

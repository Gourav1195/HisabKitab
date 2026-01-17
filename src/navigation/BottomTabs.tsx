import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SellStack from './SellStack';
import InventoryStack from './InventoryStack';
import DashboardScreen from '../screens/DashboardScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

const InventoryTabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <MaterialCommunityIcons
    name="package-variant"
    color={color}
    size={size}
  />
);
const SalesTabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <MaterialCommunityIcons
    name="cart"
    color={color}
    size={size}
  />
);
const DashboardTabBarIcon = ({ color, size }: { color: string; size: number }) => (
  <MaterialCommunityIcons
    name="view-dashboard"
    color={color}
    size={size}
  />
);

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerTitle: 'HisabKitab',
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: '#777',
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryStack}
        options={{ title: 'Inventory', 
          tabBarIcon: InventoryTabBarIcon,
        }}
        listeners={({ navigation }) => ({
        tabPress: _e => {
          navigation.navigate('Inventory', {
            screen: 'InventoryList',
          });
         },
        })}
      />
      <Tab.Screen
        name="Sell"
        component={SellStack}
        options={{ title: 'Sell',
          tabBarIcon: SalesTabBarIcon,
         }}
        listeners={({ navigation }) => ({
        tabPress: _e => {
          navigation.navigate('Sell', {
            screen: 'SellHome',
          });
        },
      })}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: DashboardTabBarIcon, }}
      />
    </Tab.Navigator>
  );
};


export default BottomTabs;

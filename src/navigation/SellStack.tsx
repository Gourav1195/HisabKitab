import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellScreen from '../screens/SellScreen';
import SalesHistoryScreen from '../screens/Sales/SalesHistoryScreen';
import SalesHistoryButton from '../components/SalesHistoryButton';
import { SalesStackParamList } from '../types/inventory';
import SaleDetailsScreen from '../screens/Sales/SaleDetailsScreen';
// const Stack = createNativeStackNavigator();
const Stack = createNativeStackNavigator<SalesStackParamList>();

const renderSalesHistoryButton = () => <SalesHistoryButton />;

const SellStack = () => {
  return (
    <Stack.Navigator>
       <Stack.Screen
        name="SellHome"
        component={SellScreen}
        options={{
          title: 'Sell Items',
          headerRight: renderSalesHistoryButton,
        }}
      />

      <Stack.Screen
        name="SalesHistory"
        component={SalesHistoryScreen}
        options={{ title: 'Sales history' }}
      />
      <Stack.Screen
        name="SaleDetails"
        component={SaleDetailsScreen}
        options={{
          title: 'Sell Details',
          headerRight: renderSalesHistoryButton,
        }}
      />
    </Stack.Navigator>
  );
};

export default SellStack;

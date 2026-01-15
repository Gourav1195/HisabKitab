import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InventoryListScreen from '../screens/InventoryListScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';

const Stack = createNativeStackNavigator();

const InventoryStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InventoryList"
        component={InventoryListScreen}
        options={{ title: 'Inventory' }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: 'Add Item' }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Item' }}
      />

    </Stack.Navigator>
  );
};

export default InventoryStack;

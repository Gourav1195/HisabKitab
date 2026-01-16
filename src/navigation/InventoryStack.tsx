import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import InventoryListScreen from '../screens/InventoryListScreen';
import ItemDetailsScreen from '../screens/ItemDetailsScreen';
import { useNavigation } from '@react-navigation/native';
import AddItemScreen from '../screens/AddItemScreen';

const Stack = createNativeStackNavigator();

const SettingsButton = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 12 }}
    >
      <Text style={{ fontSize: 18 }}>⚙️</Text>
    </TouchableOpacity>
  );
};

const InventoryStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InventoryList"
        component={InventoryListScreen}
        options={{
          title: 'Inventory',
          headerRight: SettingsButton,
        }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: 'Add item' }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailsScreen}
        options={{ title: 'Item details' }}
      />
    </Stack.Navigator>
  );
};



export default InventoryStack;

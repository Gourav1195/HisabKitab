import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { addItem } from '../repo/inventoryRepo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const AddItemScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');

  const onSave = () => {
    if (!name.trim()) return;
    addItem(name.trim());
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Item name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Sugar"
        style={styles.input}
      />
      <Button title="Save" onPress={onSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
});

export default AddItemScreen;

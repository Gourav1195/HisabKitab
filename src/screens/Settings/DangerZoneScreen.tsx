import React from 'react';
import { View,  Button, Alert } from 'react-native';
import { getDB } from '../../db';

const DangerZoneScreen = () => {
  const clearAll = () => {
    Alert.alert(
    'Clear all data',
      'This will Delete your all items.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const db = getDB();
            // db.execute('DELETE FROM items');
            db.execute(`UPDATE items
                SET is_deleted = 1, 
                updated_at = ?`,[Date.now()]);
          },
        },
      ]
    );
  };

  return (
    <View>
      <Button title="Delete all data" color="red" onPress={clearAll} />
    </View>
  );
};

export default DangerZoneScreen;

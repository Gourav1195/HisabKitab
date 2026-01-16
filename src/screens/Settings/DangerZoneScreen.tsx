import React from 'react';
import { View,  Button, Alert } from 'react-native';
import { getDB } from '../../db';

const DangerZoneScreen = () => {
  const clearAll = () => {
    Alert.alert(
    //   'Clear all data',
        //   'This will permanently delete all items.',
    'Archive all data',
      'This will Archive your all items.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
        //   text: 'Delete',
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            const db = getDB();
            // db.execute('DELETE FROM items');
            db.execute(`UPDATE items
                SET is_deleted = 1, updated_at = ?
                WHERE id = ?
                `);
          },
        },
      ]
    );
  };

  return (
    <View>
      <Button title="Clear all data" color="red" onPress={clearAll} />
    </View>
  );
};

export default DangerZoneScreen;

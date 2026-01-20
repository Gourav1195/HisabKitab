import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SettingsScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('DataSettings')}
      >
        <Text style={styles.title}>Data & Backup</Text>
        <Text style={styles.sub}>Export, backup, restore</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('AppInfo')}
      >
        <Text style={styles.title}>App Info</Text>
        <Text style={styles.sub}>Version, about</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('DangerZone')}
      >
        <Text style={[styles.title, styles.danger]}>
          {/* Danger Zone */}
          Delete All  Data
        </Text>
        <Text style={styles.sub}>Clear all data</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('ArchivedItems')}
      >
        <Text style={styles.title}>Bin</Text>
        <Text style={styles.sub}>Restore Deleted items</Text>
      </TouchableOpacity>

    </View>
  );
};

export default SettingsScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  sub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  danger: {
    color: '#d9534f',
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/Colors';
import { Alert } from 'react-native';
import { triggerBackup } from '../../backup/backupService';
import { getLastBackup } from '../../backup/getLastBackup';
import { restoreFromBackup } from '../../backup/restoreService';

const BackupScreen = () => {
  const [loading, setLoading] = React.useState(false);
  const [lastBackup, setLastBackup] = React.useState<{
    lastBackupAt: string | null;
    type: 'AUTO' | 'MANUAL' | null;
  } | null>(null);

  useEffect(() => {
    getLastBackup().then(setLastBackup);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MaterialCommunityIcons
          name="cloud-upload-outline"
          size={32}
          color={Colors.primary}
        />

        <Text style={styles.title}>Backup & Restore</Text>

        <Text style={styles.subtitle}>
          Your data is saved locally. Backup keeps it safe if you change phone.
        </Text>

        <TouchableOpacity
          style={[
            styles.backupBtn,
            loading && { opacity: 0.6 },
          ]}
          disabled={loading}
          onPress={async () => {
            try {
              setLoading(true);
              await triggerBackup('MANUAL');
              const info = await getLastBackup();
              setLastBackup(info);
              Alert.alert('Backup complete', 'Your data is safely backed up.');
            } catch (e: any) {
              Alert.alert('Backup failed', e.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          <MaterialCommunityIcons
            name={loading ? 'loading' : 'cloud-upload'}
            size={18}
            color={Colors.surface}
          />
          <Text style={styles.backupText}>
            {loading ? 'Backing up…' : 'Backup now'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.muted}>
        Automatic daily backup runs when you open the app.
        </Text>
      </View>
      {lastBackup?.lastBackupAt && (
      <Text style={styles.lastBackup}>
        Last backup: {new Date(lastBackup.lastBackupAt).toLocaleString()}
        {lastBackup.type === 'MANUAL' ? ' (manual)' : ''}
      </Text>
    )}


<TouchableOpacity
  style={[styles.restoreBtn]}
  onPress={() => {
    Alert.alert(
      'Restore backup',
      'This will replace all current data on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await restoreFromBackup();
              Alert.alert('Restore complete', 'Restart the app.');
            } catch (e: any) {
              Alert.alert('Restore failed', e.message);
            }
          },
        },
      ]
    );
  }}
>
  <MaterialCommunityIcons name="cloud-download" size={18} />
  <Text>Restore backup</Text>
</TouchableOpacity>

    </View>
  );
};

export default BackupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backupText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  muted: {
    marginTop: 12,
    fontSize: 12,
    color: Colors.textLight,
  },
    lastBackup: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  restoreBtn: {
    marginTop: 30,
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme/Colors';
import { triggerBackup, deleteCloudBackups } from '../../backup/backupService';
import { getLastBackup } from '../../backup/getLastBackup';
import { restoreLatestBackup } from '../../backup/restoreService';
import { getVerifiedEmail, sendCode, verifyCode, signOut } from '../../backup/authSession';
import { getProfile } from '../../profile/getProfile';

type LastBackup = { lastBackupAt: string | null; type: 'AUTO' | 'MANUAL' | null } | null;

const BackupScreen = () => {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(getVerifiedEmail());
  const [emailInput, setEmailInput] = useState<string>(getProfile()?.email ?? '');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<LastBackup>(null);

  const refreshLast = () => getLastBackup().then(setLastBackup);

  // A failed request can sign the user out (expired session); keep the UI in sync.
  const syncVerified = () => setVerifiedEmail(getVerifiedEmail());

  useEffect(() => {
    if (verifiedEmail) refreshLast().finally(syncVerified);
  }, [verifiedEmail]);

  const onSendCode = async () => {
    try {
      setBusy(true);
      await sendCode(emailInput);
      setCodeSent(true);
      Alert.alert('Code sent', `Check ${emailInput.trim()} for your code.`);
    } catch (e: any) {
      Alert.alert('Could not send code', e.message);
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    try {
      setBusy(true);
      const email = await verifyCode(emailInput, code);
      setCode('');
      setCodeSent(false);
      setVerifiedEmail(email);
    } catch (e: any) {
      Alert.alert('Verification failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!verifiedEmail) {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <MaterialCommunityIcons name="email-check-outline" size={32} color={Colors.primary} />
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Backups are linked to your email. We send a one-time code so only you can restore your data.
          </Text>

          <TextInput
            style={styles.input}
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
          />

          {codeSent && (
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={t => setCode(t.replace(/\D/g, ''))}
              placeholder="Code from email"
              keyboardType="number-pad"
              maxLength={10}
              editable={!busy}
            />
          )}

          <TouchableOpacity
            style={[styles.backupBtn, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={codeSent ? onVerify : onSendCode}
          >
            <Text style={styles.backupText}>
              {busy ? 'Please wait…' : codeSent ? 'Verify' : 'Send code'}
            </Text>
          </TouchableOpacity>

          {codeSent && (
            <TouchableOpacity disabled={busy} onPress={onSendCode}>
              <Text style={styles.link}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <MaterialCommunityIcons name="cloud-upload-outline" size={32} color={Colors.primary} />

        <Text style={styles.title}>Backup & Restore</Text>

        <Text style={styles.subtitle}>
          Your data is saved locally. Backup keeps it safe if you change phone.
        </Text>

        <TouchableOpacity
          style={[styles.backupBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={async () => {
            try {
              setLoading(true);
              await triggerBackup('MANUAL');
              await refreshLast();
              Alert.alert('Backup complete', 'Your data is safely backed up.');
            } catch (e: any) {
              Alert.alert('Backup failed', e.message);
            } finally {
              setLoading(false);
              syncVerified();
            }
          }}
        >
          <MaterialCommunityIcons
            name={loading ? 'loading' : 'cloud-upload'}
            size={18}
            color={Colors.surface}
          />
          <Text style={styles.backupText}>{loading ? 'Backing up…' : 'Backup now'}</Text>
        </TouchableOpacity>

        <Text style={styles.muted}>Automatic daily backup runs when you open the app.</Text>
        <Text style={styles.muted}>Signed in as {verifiedEmail}</Text>
      </View>

      {lastBackup?.lastBackupAt && (
        <Text style={styles.lastBackup}>
          Last backup: {new Date(lastBackup.lastBackupAt).toLocaleString('en-IN')}
          {lastBackup.type === 'MANUAL' ? ' (manual)' : ''}
        </Text>
      )}

      <TouchableOpacity
        style={styles.restoreBtn}
        onPress={() => {
          Alert.alert('Restore backup', 'This will replace all current data on this device.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                try {
                  await restoreLatestBackup();
                  Alert.alert('Restore complete', 'Restart the app.');
                } catch (e: any) {
                  Alert.alert('Restore failed', e.message);
                } finally {
                  syncVerified();
                }
              },
            },
          ]);
        }}
      >
        <MaterialCommunityIcons name="cloud-download" size={18} />
        <Text>Restore backup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restoreBtn}
        onPress={() => {
          Alert.alert(
            'Delete cloud backups',
            'This permanently deletes every backup stored online for this email. Data on this phone is not affected.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteCloudBackups();
                    setLastBackup(null);
                    Alert.alert('Deleted', 'Your cloud backups have been deleted.');
                  } catch (e: any) {
                    Alert.alert('Delete failed', e.message);
                  } finally {
                    syncVerified();
                  }
                },
              },
            ],
          );
        }}
      >
        <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.stockOut} />
        <Text style={{ color: Colors.stockOut }}>Delete cloud backups</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          signOut();
          setLastBackup(null);
          setVerifiedEmail(null);
        }}
      >
        <Text style={styles.link}>Use a different email</Text>
      </TouchableOpacity>
    </ScrollView>
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
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  link: {
    marginTop: 16,
    fontSize: 13,
    color: Colors.primary,
    textAlign: 'center',
  },
  restoreBtn: {
    marginTop: 16,
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

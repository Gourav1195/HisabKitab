import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/Colors';
import { getProfile, updateProfile } from '../../repo/profileRepo';

const ProfileScreen = () => {
  const [profile, setProfile] = useState<any>(null);
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setShopName(p?.shop_name ?? '');
    setPhone(p?.phone ?? '');
  }, []);

  const save = () => {
    updateProfile({ shop_name: shopName.trim(), phone: phone.trim() });
  };

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Shop</Text>
      <Text style={styles.subtitle}>
        This helps us keep your data safe and synced.
      </Text>

      <TextInput
        placeholder="Shop name"
        value={shopName}
        onChangeText={setShopName}
        onBlur={save}
        style={styles.input}
      />

      <TextInput
        placeholder="Phone (optional)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        onBlur={save}
        style={styles.input}
      />

      <View style={styles.backupBox}>
        <Text style={styles.backupTitle}>Backup</Text>
        <Text style={styles.backupText}>
          Automatic daily backup keeps your data safe.
        </Text>

        <TouchableOpacity style={styles.backupBtn}>
          <Text style={styles.backupBtnText}>Enable Backup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginVertical: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    marginTop: 20,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  backupBox: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  backupText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  backupBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  backupBtnText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});

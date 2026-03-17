import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography, BorderRadius, Shadow, getScaledFontSize } from '../theme/Colors';
import { useUISettings } from '../ui/UISettingsContext';

type NavRowProps = {
  icon: string; label: string; sub?: string;
  onPress: () => void; danger?: boolean; fontScale: number;
};

const SectionLabel = ({ title, fontScale }: { title: string; fontScale: number }) => (
  <Text style={[styles.sectionLabel, { fontSize: Typography.fontSize.xs * fontScale }]}>
    {title}
  </Text>
);

const NavRow = ({ icon, label, sub, onPress, danger = false, fontScale }: NavRowProps) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.65}>
    <View style={[styles.iconWrap, danger ? styles.iconWrapDanger : styles.iconWrapDefault]}>
      <MaterialCommunityIcons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
    </View>
    <View style={styles.rowBody}>
      <Text style={[styles.rowTitle, danger && styles.rowTitleDanger,
        { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale) }]}>
        {label}
      </Text>
      {sub ? (
        <Text style={[styles.rowSub, { fontSize: Typography.fontSize.xs * fontScale }]}>{sub}</Text>
      ) : null}
    </View>
    <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
  </TouchableOpacity>
);

const RowDivider = () => <View style={styles.rowDivider} />;

const FontScaleRow = ({ fontScale }: { fontScale: number }) => {
  const { setFontScale } = useUISettings();
  const percent = Math.round(fontScale * 100);
  const steps = [0.85, 1.0, 1.15, 1.3, 1.5];
  const labels = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <View style={styles.fontRow}>
      <View style={[styles.iconWrap, styles.iconWrapDefault]}>
        <MaterialCommunityIcons name="format-size" size={18} color={Colors.primary} />
      </View>
      <View style={styles.fontRowBody}>
        <View style={styles.fontLabelRow}>
          <Text style={[styles.rowTitle, { fontSize: getScaledFontSize(Typography.fontSize.md, fontScale) }]}>
            Text Size
          </Text>
          <Text style={[styles.fontPercent, { fontSize: Typography.fontSize.sm * fontScale }]}>
            {percent}%
          </Text>
        </View>
        <View style={styles.fontSteps}>
          {steps.map((step, i) => {
            const isActive = Math.abs(fontScale - step) < 0.05;
            return (
              <TouchableOpacity
                key={step}
                style={[styles.fontStep, isActive && styles.fontStepActive]}
                onPress={() => setFontScale(step)}
                activeOpacity={0.7}
              >
                <Text style={[styles.fontStepText, isActive && styles.fontStepTextActive]}>
                  {labels[i]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const SettingsScreen = ({ navigation }: any) => {
  const { fontScale } = useUISettings();   // ← read ONCE here, pass everywhere

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageTitle, { fontSize: getScaledFontSize(Typography.fontSize.xxxl, fontScale) }]}>
        Settings
      </Text>

      <SectionLabel title="APPEARANCE" fontScale={fontScale} />
      <View style={styles.card}>
        <FontScaleRow fontScale={fontScale} />
      </View>

      <SectionLabel title="ACCOUNT" fontScale={fontScale} />
      <View style={styles.card}>
        <NavRow icon="account-outline" label="Profile" sub="Shop name, email"
          onPress={() => navigation.navigate('Profile')} fontScale={fontScale} />
        <RowDivider />
        <NavRow icon="cloud-upload-outline" label="Backup & Restore" sub="Manual and automatic backups"
          onPress={() => navigation.navigate('Backup')} fontScale={fontScale} />
      </View>

      <SectionLabel title="DATA" fontScale={fontScale} />
      <View style={styles.card}>
        <NavRow icon="database-export-outline" label="Download Data" sub="Export as CSV or JSON"
          onPress={() => navigation.navigate('DataSettings')} fontScale={fontScale} />
        <RowDivider />
        <NavRow icon="archive-outline" label="Archived Items" sub="Restore items you've hidden"
          onPress={() => navigation.navigate('ArchivedItems')} fontScale={fontScale} />
      </View>

      <SectionLabel title="ABOUT" fontScale={fontScale} />
      <View style={styles.card}>
        <NavRow icon="information-outline" label="App Info" sub="Version and details"
          onPress={() => navigation.navigate('AppInfo')} fontScale={fontScale} />
      </View>

      <SectionLabel title="DANGER ZONE" fontScale={fontScale} />
      <View style={styles.card}>
        <NavRow icon="trash-can-outline" label="Delete All Data" sub="Permanently erase everything"
          danger onPress={() => navigation.navigate('DangerZone')} fontScale={fontScale} />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  pageTitle: { fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  sectionLabel: { fontWeight: Typography.fontWeight.bold, color: Colors.textLight,
    letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl, marginBottom: Spacing.sm },
  card: { backgroundColor: Colors.surface, marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight,
    overflow: 'hidden', ...Shadow.sm },
  rowDivider: { height: 1, backgroundColor: Colors.borderLight,
    marginLeft: Spacing.xl + 34 + Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg, gap: Spacing.lg },
  iconWrap: { width: 34, height: 34, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center' },
  iconWrapDefault: { backgroundColor: Colors.primaryLighter },
  iconWrapDanger: { backgroundColor: Colors.error + '18' },
  rowBody: { flex: 1 },
  rowTitle: { fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  rowTitleDanger: { color: Colors.error },
  rowSub: { color: Colors.textSecondary, marginTop: 2 },
  fontRow: { flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.lg },
  fontRowBody: { flex: 1 },
  fontLabelRow: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg },
  fontPercent: { fontWeight: Typography.fontWeight.bold, color: Colors.primary },
  fontSteps: { flexDirection: 'row', gap: Spacing.sm },
  fontStep: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md,
    alignItems: 'center', backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border },
  fontStepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fontStepText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary },
  fontStepTextActive: { color: Colors.textInverse },
  bottomSpacer: { height: Spacing.xxl },
});

export default SettingsScreen;
import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../../theme/Colors';


export const SettingsButton = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: Spacing.md }}
    >
      <MaterialCommunityIcons
        name="cog"
        size={20}
        color={Colors.primary}
      />
    </TouchableOpacity>
  );
};
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export const Badge = ({
  label,
  variant = 'default', // 'paid' | 'partial' | 'unpaid' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size = 'md', // 'sm' | 'md'
}) => {
  const getColors = () => {
    switch (variant) {
      case 'paid':
      case 'success':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'partial':
      case 'warning':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'unpaid':
      case 'danger':
        return { bg: COLORS.dangerLight, text: COLORS.danger };
      case 'info':
        return { bg: COLORS.infoLight, text: COLORS.info };
      default:
        return { bg: COLORS.surface, text: COLORS.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, styles[size], { backgroundColor: bg }]}>
      <Text style={[styles.text, styles[`${size}Text`], { color: text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 11,
  },
});

export default Badge;

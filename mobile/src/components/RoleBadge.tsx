import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const getRoleConfig = () => {
    switch (role) {
      case 'broker':
        return { label: 'Licensed Broker', bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'seller':
        return { label: 'Property Seller', bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'buyer':
      default:
        return { label: 'Land Buyer', bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
    }
  };

  const config = getRoleConfig();
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;
  const paddingVertical = size === 'sm' ? 2 : size === 'lg' ? 6 : 4;
  const paddingHorizontal = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      <Text style={[styles.text, { color: config.text, fontSize }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

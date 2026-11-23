import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

export const DemoRoleSwitcher: React.FC = () => {
  const { user, role, switchDemoRole } = useAuthStore();

  const roles: { key: UserRole; label: string; name: string }[] = [
    { key: 'buyer', label: 'Buyer', name: 'Alex R.' },
    { key: 'seller', label: 'Seller', name: 'Sarah J.' },
    { key: 'broker', label: 'Broker', name: 'Michael V.' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Evaluator Quick-Role Switcher:</Text>
        <Text style={styles.current}>Active: <Text style={styles.activeText}>{user?.profile?.full_name || user?.email}</Text></Text>
      </View>
      <View style={styles.buttonsRow}>
        {roles.map((r) => {
          const isActive = role === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.btn, isActive && styles.btnActive]}
              onPress={() => switchDemoRole(r.key)}
            >
              <Text style={[styles.btnText, isActive && styles.btnTextActive]}>
                {r.label} ({r.name})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  current: {
    color: '#64748b',
    fontSize: 11,
  },
  activeText: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  btnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  btnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

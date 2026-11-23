import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { RoleBadge } from '../../components/RoleBadge';
import { DemoRoleSwitcher } from '../../components/DemoRoleSwitcher';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, role, logout } = useAuthStore();

  const profile = user?.profile;
  const avatar = profile?.avatar_url;

  return (
    <ScrollView style={styles.container}>
      <DemoRoleSwitcher />

      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {profile?.full_name?.charAt(0) || user?.email.charAt(0) || 'U'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.fullName}>{profile?.full_name || 'LandConnect User'}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        <View style={styles.badgeRow}>
          <RoleBadge role={role} size="md" />
        </View>

        {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
      </View>

      {/* Role Details & Permissions Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Role Permissions & Capabilities</Text>

        {role === 'broker' && (
          <View style={styles.brokerSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brokerage Firm:</Text>
              <Text style={styles.detailVal}>{profile?.company_or_agency || 'Apex Land Realty Group'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>License Number:</Text>
              <Text style={styles.detailVal}>{profile?.license_number || 'CA-DRE-01948210'}</Text>
            </View>
            <View style={styles.permList}>
              <Text style={styles.permItem}>✓ Create & manage commercial/agricultural listings</Text>
              <Text style={styles.permItem}>✓ Host virtual boundary & survey meeting rooms</Text>
              <Text style={styles.permItem}>✓ Direct WebRTC audio/video consultations</Text>
            </View>
          </View>
        )}

        {role === 'seller' && (
          <View style={styles.sellerSection}>
            <View style={styles.permList}>
              <Text style={styles.permItem}>✓ Publish and manage personal land tracts</Text>
              <Text style={styles.permItem}>✓ Upload photos, boundary specs, and pricing</Text>
              <Text style={styles.permItem}>✓ Receive live video and audio inquiries from buyers</Text>
            </View>
          </View>
        )}

        {role === 'buyer' && (
          <View style={styles.buyerSection}>
            <View style={styles.permList}>
              <Text style={styles.permItem}>✓ Search, filter, and view all marketplace land</Text>
              <Text style={styles.permItem}>✓ Shortlist and save favorite properties</Text>
              <Text style={styles.permItem}>✓ Initiate 1-on-1 audio & video calls to sellers</Text>
              <Text style={styles.permItem}>✓ Join live meeting rooms for property walkthroughs</Text>
            </View>
          </View>
        )}
      </View>

      {/* Privacy & Communication Security */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Privacy & Communication Security</Text>
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.securityTitle}>Phone Number Obfuscation</Text>
            <Text style={styles.securitySub}>
              All communications occur securely in-app via WebRTC without disclosing personal phone numbers.
            </Text>
          </View>
        </View>

        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={20} color="#0284c7" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.securityTitle}>Role-Based Access Control</Text>
            <Text style={styles.securitySub}>
              Listing modifications and chat rooms are strictly verified on the Python backend.
            </Text>
          </View>
        </View>
      </View>

      {/* Settings & Actions */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyListings')}
        >
          <Ionicons name="list" size={20} color="#475569" />
          <Text style={styles.menuItemText}>My Listed Properties</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Ionicons name="heart" size={20} color="#475569" />
          <Text style={styles.menuItemText}>Shortlisted Properties</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MeetingRooms')}
        >
          <Ionicons name="videocam" size={20} color="#475569" />
          <Text style={styles.menuItemText}>Virtual Meeting Rooms</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0284c7',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  emailText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  badgeRow: {
    marginVertical: 4,
  },
  bioText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  brokerSection: {},
  sellerSection: {},
  buyerSection: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  permList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 4,
  },
  permItem: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  securitySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  logoutText: {
    color: '#ef4444',
  },
});

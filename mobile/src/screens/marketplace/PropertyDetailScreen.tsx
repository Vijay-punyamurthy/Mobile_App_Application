import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../../store/propertyStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { useChatStore } from '../../store/chatStore';
import { RoleBadge } from '../../components/RoleBadge';
import { InteractiveMap } from '../../components/InteractiveMap';
import { Property } from '../../types';

export const PropertyDetailScreen = ({ route, navigation }: any) => {
  const { propertyId } = route.params;
  const { fetchPropertyDetails, toggleFavorite } = usePropertyStore();
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();
  const { startConversation } = useChatStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [propertyId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchPropertyDetails(propertyId);
      setProperty(data);
    } catch (e) {
      console.warn('Failed to load property details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out ${property.title} on LandConnect for $${property.price.toLocaleString()}!`,
      });
    } catch (e) {}
  };

  const handleStartChat = async () => {
    if (!property || !user || property.owner_id === user.id) return;
    try {
      const convo = await startConversation(
        property.owner_id,
        property.id,
        `Hello! I'm interested in "${property.title}". Can we connect?`
      );
      navigation.navigate('ChatTab', {
        screen: 'ChatDetail',
        params: { conversationId: convo.id, title: property.owner?.profile?.full_name || 'Seller' },
      });
    } catch (e) {
      console.warn('Error starting chat:', e);
    }
  };

  const handleStartAudioCall = () => {
    if (!property || !user || property.owner_id === user.id) return;
    const name = property.owner?.profile?.full_name || 'Seller';
    initiateCall(property.owner_id, name, 'audio', property.owner?.profile?.avatar_url);
  };

  const handleStartVideoCall = () => {
    if (!property || !user || property.owner_id === user.id) return;
    const name = property.owner?.profile?.full_name || 'Seller';
    initiateCall(property.owner_id, name, 'video', property.owner?.profile?.avatar_url);
  };

  if (loading || !property) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  const isOwner = user?.id === property.owner_id;
  const images = property.images && property.images.length > 0
    ? property.images.map((img) => img.image_url)
    : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery Hero */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: images[activeImageIdx] }} style={styles.heroImage} resizeMode="cover" />
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.topRightActions}>
            <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => {
                toggleFavorite(property.id);
                setProperty((p) => (p ? { ...p, is_favorited: !p.is_favorited } : null));
              }}
            >
              <Ionicons
                name={property.is_favorited ? 'heart' : 'heart-outline'}
                size={22}
                color={property.is_favorited ? '#ef4444' : '#0f172a'}
              />
            </TouchableOpacity>
          </View>

          {images.length > 1 && (
            <View style={styles.thumbnailsRow}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumbnailWrap, activeImageIdx === idx && styles.thumbnailActive]}
                  onPress={() => setActiveImageIdx(idx)}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImg} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          <View style={styles.badgeRow}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{property.property_type.toUpperCase()}</Text>
            </View>
            <View style={styles.statusTag}>
              <Text style={styles.statusTagText}>{property.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.price}>${property.price.toLocaleString()} <Text style={styles.priceUnit}>{property.price_unit}</Text></Text>
          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={16} color="#0284c7" />
            <Text style={styles.addressText}>{property.address}, {property.city}, {property.state}</Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="scan-outline" size={20} color="#0284c7" />
              <Text style={styles.statVal}>{property.land_area}</Text>
              <Text style={styles.statLabel}>{property.area_unit.toUpperCase()}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="pricetag-outline" size={20} color="#059669" />
              <Text style={styles.statVal}>${Math.round(property.price / property.land_area).toLocaleString()}</Text>
              <Text style={styles.statLabel}>PER {property.area_unit.toUpperCase()}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="business-outline" size={20} color="#7c3aed" />
              <Text style={styles.statVal} numberOfLines={1}>Zoning</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{property.zoning_classification || 'A-1'}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Description</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>

          {/* Geolocation & Interactive Map */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Location & Coordinates</Text>
              <Text style={styles.gpsBadge}>
                {property.latitude.toFixed(4)}°N, {Math.abs(property.longitude).toFixed(4)}°W
              </Text>
            </View>
            <InteractiveMap
              properties={[property]}
              selectedProperty={property}
              height={220}
            />
          </View>

          {/* Seller / Broker Profile Card */}
          {property.owner?.profile && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerHeader}>
                <Image
                  source={{
                    uri:
                      property.owner.profile.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  }}
                  style={styles.sellerAvatar}
                />
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{property.owner.profile.full_name}</Text>
                  <RoleBadge role={property.owner.role} size="sm" />
                  {property.owner.profile.company_or_agency && (
                    <Text style={styles.sellerAgency}>{property.owner.profile.company_or_agency}</Text>
                  )}
                  {property.owner.profile.license_number && (
                    <Text style={styles.sellerLicense}>License: {property.owner.profile.license_number}</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Contact Bar */}
      {!isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.chatActionBtn} onPress={handleStartChat}>
            <Ionicons name="chatbubbles" size={18} color="#0284c7" />
            <Text style={styles.chatActionText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.audioActionBtn} onPress={handleStartAudioCall}>
            <Ionicons name="call" size={18} color="#059669" />
            <Text style={styles.audioActionText}>Audio Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.videoActionBtn} onPress={handleStartVideoCall}>
            <Ionicons name="videocam" size={18} color="#ffffff" />
            <Text style={styles.videoActionText}>Live Video Walk</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  topRightActions: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  thumbnailsRow: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#38bdf8',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  contentBody: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
  },
  statusTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  priceUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  gpsBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0284c7',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  sellerCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  sellerAgency: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 4,
  },
  sellerLicense: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 6,
  },
  chatActionText: {
    color: '#0284c7',
    fontWeight: '700',
    fontSize: 14,
  },
  audioActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 6,
  },
  audioActionText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  videoActionBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    gap: 6,
    shadowColor: '#0284c7',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  videoActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

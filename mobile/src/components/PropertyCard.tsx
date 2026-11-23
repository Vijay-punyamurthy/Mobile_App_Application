import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Property } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../store/propertyStore';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  onContactChat?: () => void;
  onContactCall?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onContactChat,
  onContactCall,
}) => {
  const { toggleFavorite } = usePropertyStore();

  const primaryImage =
    property.images && property.images.length > 0
      ? property.images[0].image_url
      : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

  const formatPrice = (val: number) => {
    return '$' + val.toLocaleString();
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case 'agricultural':
        return '#059669';
      case 'commercial':
        return '#d97706';
      case 'industrial':
        return '#dc2626';
      default:
        return '#2563eb';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: primaryImage }} style={styles.image} resizeMode="cover" />
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: getTagColor(property.property_type) }]}>
            <Text style={styles.typeText}>{property.property_type.toUpperCase()}</Text>
          </View>
          <View style={styles.areaBadge}>
            <Ionicons name="scan-outline" size={13} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.areaText}>
              {property.land_area} {property.area_unit}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            toggleFavorite(property.id);
          }}
        >
          <Ionicons
            name={property.is_favorited ? 'heart' : 'heart-outline'}
            size={20}
            color={property.is_favorited ? '#ef4444' : '#ffffff'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          <Text style={styles.unitText}>{property.price_unit}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color="#64748b" />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.city}, {property.state}
          </Text>
        </View>

        {property.owner?.profile && (
          <View style={styles.ownerFooter}>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.avatarInitial}>
                  {property.owner.profile.full_name?.charAt(0) || 'U'}
                </Text>
              </View>
              <Text style={styles.ownerName} numberOfLines={1}>
                {property.owner.profile.full_name}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {onContactChat && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onContactChat();
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#0284c7" />
                </TouchableOpacity>
              )}
              {onContactCall && (
                <TouchableOpacity
                  style={[styles.iconBtn, styles.callBtn]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onContactCall();
                  }}
                >
                  <Ionicons name="videocam" size={16} color="#059669" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  areaBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  unitText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  ownerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  ownerName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: '#f0f9ff',
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  callBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
});

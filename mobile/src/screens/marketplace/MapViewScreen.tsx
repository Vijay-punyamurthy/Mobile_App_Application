import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../../store/propertyStore';
import { InteractiveMap } from '../../components/InteractiveMap';
import { Property } from '../../types';

export const MapViewScreen = ({ navigation }: any) => {
  const { properties, isLoading, fetchProperties } = usePropertyStore();
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  useEffect(() => {
    if (properties.length === 0) {
      fetchProperties();
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Land Exploration Map</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <InteractiveMap
            properties={properties}
            selectedProperty={selectedProp}
            onSelectProperty={(p) => setSelectedProp(p)}
            height={600}
          />
        </View>
      )}

      {selectedProp && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {selectedProp.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedProp(null)}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardPrice}>
            ${selectedProp.price.toLocaleString()} • {selectedProp.land_area} {selectedProp.area_unit}
          </Text>
          <Text style={styles.cardLocation}>
            {selectedProp.city}, {selectedProp.state}
          </Text>
          <TouchableOpacity
            style={styles.viewDetailBtn}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: selectedProp.id })}
          >
            <Text style={styles.viewDetailText}>Open Full Listing</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    padding: 10,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  viewDetailText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../types';

interface InteractiveMapProps {
  properties?: Property[];
  selectedProperty?: Property | null;
  onSelectProperty?: (prop: Property) => void;
  isPickerMode?: boolean;
  pickedCoords?: { latitude: number; longitude: number };
  onPickCoords?: (coords: { latitude: number; longitude: number }) => void;
  height?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  properties = [],
  selectedProperty,
  onSelectProperty,
  isPickerMode = false,
  pickedCoords = { latitude: 30.2752, longitude: -98.8719 },
  onPickCoords,
  height = 300,
}) => {
  const [mapType, setMapType] = useState<'satellite' | 'terrain' | 'streets'>('satellite');
  const [activePin, setActivePin] = useState<Property | null>(selectedProperty || null);

  // Normalize coordinates into relative 0-100% canvas positions for visual plotting
  const getCoordinatesPosition = (lat: number, lng: number) => {
    // US bounds approximation: Lat: 24 to 49, Lng: -125 to -66
    const minLat = 24.0;
    const maxLat = 49.0;
    const minLng = -125.0;
    const maxLng = -66.0;

    const x = Math.min(Math.max(((lng - minLng) / (maxLng - minLng)) * 100, 10), 90);
    const y = Math.min(Math.max((1 - (lat - minLat) / (maxLat - minLat)) * 100, 10), 90);

    return { left: `${x}%`, top: `${y}%` };
  };

  const handleMapPress = (e: any) => {
    if (!isPickerMode || !onPickCoords) return;
    const { locationX, locationY } = e.nativeEvent;
    // Map relative click position back to coordinates
    const approxLat = Number((38.0 - (locationY / height) * 12).toFixed(4));
    const approxLng = Number((-110.0 + (locationX / 340) * 30).toFixed(4));
    onPickCoords({ latitude: approxLat, longitude: approxLng });
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Map Header & Layer Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.indicator}>
          <Ionicons name="navigate-circle" size={16} color="#0284c7" />
          <Text style={styles.indicatorText}>
            {isPickerMode ? 'Tap anywhere to drop pin' : `${properties.length} Parcels Plotted`}
          </Text>
        </View>

        <View style={styles.typeSwitcher}>
          {(['satellite', 'terrain', 'streets'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, mapType === type && styles.typeBtnActive]}
              onPress={() => setMapType(type)}
            >
              <Text style={[styles.typeBtnText, mapType === type && styles.typeBtnTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map Canvas with Satellite/Topographic grid styling */}
      <TouchableOpacity
        activeOpacity={1}
        style={[
          styles.mapCanvas,
          mapType === 'satellite' ? styles.canvasSatellite : mapType === 'terrain' ? styles.canvasTerrain : styles.canvasStreets,
        ]}
        onPress={handleMapPress}
      >
        {/* Grid lines overlay */}
        <View style={styles.gridOverlay} />

        {/* Picker Mode Pin */}
        {isPickerMode && (
          <View
            style={[
              styles.pickerPin,
              getCoordinatesPosition(pickedCoords.latitude, pickedCoords.longitude),
            ]}
          >
            <View style={styles.pinBubble}>
              <Text style={styles.pinBubbleText}>
                {pickedCoords.latitude.toFixed(2)}°, {pickedCoords.longitude.toFixed(2)}°
              </Text>
            </View>
            <Ionicons name="location" size={32} color="#ef4444" />
          </View>
        )}

        {/* Regular Property Markers */}
        {!isPickerMode &&
          properties.map((prop) => {
            const pos = getCoordinatesPosition(prop.latitude, prop.longitude);
            const isSelected = activePin?.id === prop.id;

            return (
              <TouchableOpacity
                key={prop.id}
                style={[styles.markerContainer, pos]}
                onPress={() => {
                  setActivePin(prop);
                  if (onSelectProperty) onSelectProperty(prop);
                }}
              >
                <View style={[styles.markerPriceTag, isSelected && styles.markerPriceTagActive]}>
                  <Text style={[styles.markerPriceText, isSelected && styles.markerPriceTextActive]}>
                    ${(prop.price / 1000).toFixed(0)}k
                  </Text>
                </View>
                <Ionicons
                  name="location-sharp"
                  size={isSelected ? 28 : 22}
                  color={isSelected ? '#0284c7' : '#059669'}
                />
              </TouchableOpacity>
            );
          })}
      </TouchableOpacity>

      {/* Active Pin Callout Card */}
      {!isPickerMode && activePin && (
        <View style={styles.calloutCard}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutTitle} numberOfLines={1}>
              {activePin.title}
            </Text>
            <TouchableOpacity onPress={() => setActivePin(null)}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={styles.calloutMeta}>
            <Text style={styles.calloutPrice}>${activePin.price.toLocaleString()}</Text>
            <Text style={styles.calloutArea}>
              {activePin.land_area} {activePin.area_unit} • {activePin.city}, {activePin.state}
            </Text>
          </View>
          <Text style={styles.calloutCoords}>
            GPS: {activePin.latitude.toFixed(4)}°N, {Math.abs(activePin.longitude).toFixed(4)}°W
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  controlsRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  indicatorText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#0284c7',
  },
  typeBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  canvasSatellite: {
    backgroundColor: '#1c2d27',
  },
  canvasTerrain: {
    backgroundColor: '#2e3a23',
  },
  canvasStreets: {
    backgroundColor: '#334155',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -18 }, { translateY: -28 }],
    zIndex: 5,
  },
  markerPriceTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  markerPriceTagActive: {
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.15 }],
  },
  markerPriceText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  markerPriceTextActive: {
    color: '#ffffff',
  },
  pickerPin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -32 }],
    zIndex: 9,
  },
  pinBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  pinBubbleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  calloutCard: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  calloutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  calloutPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284c7',
  },
  calloutArea: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  calloutCoords: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontFamily: 'monospace',
  },
});

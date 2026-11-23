import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../../store/propertyStore';
import { useAuthStore } from '../../store/authStore';
import { InteractiveMap } from '../../components/InteractiveMap';

export const CreatePropertyScreen = ({ navigation }: any) => {
  const { createListing, isLoading } = usePropertyStore();
  const { role } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [landArea, setLandArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [propertyType, setPropertyType] = useState<'agricultural' | 'residential' | 'commercial' | 'industrial'>('agricultural');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zoning, setZoning] = useState('Ag-1 Agricultural / Rural');
  const [imageUrl, setImageUrl] = useState('');
  const [coordinates, setCoordinates] = useState({ latitude: 30.2752, longitude: -98.8719 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (role === 'buyer') {
    return (
      <View style={styles.restrictedContainer}>
        <Ionicons name="lock-closed" size={48} color="#ef4444" />
        <Text style={styles.restrictedTitle}>Role-Based Access Control</Text>
        <Text style={styles.restrictedText}>
          Buyer accounts cannot create land listings. Switch to a Seller or Broker account using the Quick Role Switcher above or in your Profile to publish new properties.
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price || !landArea || !address.trim() || !city.trim() || !state.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    setErrorMsg(null);

    const priceNum = parseFloat(price);
    const areaNum = parseFloat(landArea);
    if (isNaN(priceNum) || priceNum <= 0 || isNaN(areaNum) || areaNum <= 0) {
      setErrorMsg('Please provide valid positive numbers for price and area.');
      return;
    }

    try {
      const defaultImg =
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';

      await createListing({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        price_unit: 'USD',
        land_area: areaNum,
        area_unit: areaUnit,
        property_type: propertyType,
        status: 'available',
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: 'United States',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        zoning_classification: zoning,
        images: [{ image_url: defaultImg, is_primary: true, sort_order: 0 } as any],
      });

      navigation.navigate('MarketplaceTab', { screen: 'MarketplaceHome' });
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create listing');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Land Listing</Text>
        <Text style={styles.headerSub}>Publish property to LandConnect Marketplace</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing Overview</Text>

          <Text style={styles.label}>Property Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rolling Oak Meadow & Timberland"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Category / Land Type</Text>
          <View style={styles.typeSelector}>
            {(['agricultural', 'residential', 'commercial', 'industrial'] as const).map((t) => {
              const isSelected = propertyType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                  onPress={() => setPropertyType(t)}
                >
                  <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Price (USD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 350000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Land Area *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 25.5"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={landArea}
                onChangeText={setLandArea}
              />
            </View>
          </View>

          <Text style={styles.label}>Area Unit</Text>
          <View style={styles.unitSelector}>
            {['acres', 'sqft', 'hectares'].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, areaUnit === u && styles.unitBtnActive]}
                onPress={() => setAreaUnit(u)}
              >
                <Text style={[styles.unitText, areaUnit === u && styles.unitTextActive]}>
                  {u.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Detailed Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe topography, access roads, utilities, water rights, and soil quality..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Geolocation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & GPS Coordinates</Text>

          <Text style={styles.label}>Street Address / Parcel Access *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 14200 Timber Ridge Trail"
            placeholderTextColor="#94a3b8"
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fredericksburg"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Texas"
                placeholderTextColor="#94a3b8"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <Text style={styles.label}>Zoning Classification</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ag-1 Agricultural / Rural"
            placeholderTextColor="#94a3b8"
            value={zoning}
            onChangeText={setZoning}
          />

          <Text style={styles.label}>
            Interactive GPS Pin (Tap map to select boundary center)
          </Text>
          <InteractiveMap
            isPickerMode
            pickedCoords={coordinates}
            onPickCoords={(coords) => setCoordinates(coords)}
            height={220}
          />
        </View>

        {/* Imagery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Imagery</Text>
          <Text style={styles.label}>Cover Image URL (Web/Cloud or Unsplash)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://images.unsplash.com/..."
            placeholderTextColor="#94a3b8"
            value={imageUrl}
            onChangeText={setImageUrl}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Publish Land Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  restrictedText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: 14,
  },
  textArea: {
    height: 90,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  unitBtnActive: {
    backgroundColor: '#0284c7',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  unitTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#0284c7',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

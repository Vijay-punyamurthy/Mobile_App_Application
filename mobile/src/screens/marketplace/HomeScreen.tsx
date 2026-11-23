import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePropertyStore } from '../../store/propertyStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { useChatStore } from '../../store/chatStore';
import { PropertyCard } from '../../components/PropertyCard';
import { DemoRoleSwitcher } from '../../components/DemoRoleSwitcher';
import { Property } from '../../types';

export const HomeScreen = ({ navigation }: any) => {
  const { properties, isLoading, fetchProperties, setSearchQuery, setFilters, filters } =
    usePropertyStore();
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();
  const { startConversation } = useChatStore();

  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    fetchProperties();
  };

  const categories = [
    { key: '', label: 'All Parcels' },
    { key: 'agricultural', label: '🌾 Agricultural' },
    { key: 'residential', label: '🏡 Residential' },
    { key: 'commercial', label: '🏢 Commercial' },
    { key: 'industrial', label: '🏭 Industrial' },
  ];

  const handleCategoryPress = (typeKey: string) => {
    setFilters({ property_type: typeKey || undefined });
    fetchProperties();
  };

  const handleContactChat = async (prop: Property) => {
    if (!user || prop.owner_id === user.id) return;
    try {
      const convo = await startConversation(
        prop.owner_id,
        prop.id,
        `Hi! I am inquiring about "${prop.title}".`
      );
      navigation.navigate('ChatTab', {
        screen: 'ChatDetail',
        params: { conversationId: convo.id, title: prop.owner?.profile?.full_name || 'Seller' },
      });
    } catch (e) {
      console.warn('Failed to start chat:', e);
    }
  };

  const handleContactCall = (prop: Property) => {
    if (!user || prop.owner_id === user.id) return;
    const targetName = prop.owner?.profile?.full_name || prop.owner?.email || 'Seller';
    initiateCall(prop.owner_id, targetName, 'video', prop.owner?.profile?.avatar_url);
  };

  return (
    <View style={styles.container}>
      {/* Evaluator Quick Switcher Header */}
      <DemoRoleSwitcher />

      {/* Main Search & Location Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search acreage, county, city..."
            placeholderTextColor="#94a3b8"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchInput('');
                setSearchQuery('');
                fetchProperties();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.mapToggleBtn}
          onPress={() => navigation.navigate('MapView')}
        >
          <Ionicons name="map-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isSelected = (filters.property_type || '') === item.key;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => handleCategoryPress(item.key)}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Property Listing Feed */}
      {isLoading && properties.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading land tracts...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="earth-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Land Listings Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search keywords or filter options.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
              onContactChat={user?.id !== item.owner_id ? () => handleContactChat(item) : undefined}
              onContactCall={user?.id !== item.owner_id ? () => handleContactCall(item) : undefined}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#0f172a',
    fontSize: 14,
  },
  mapToggleBtn: {
    backgroundColor: '#0284c7',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});

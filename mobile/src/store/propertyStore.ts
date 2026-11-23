import { create } from 'zustand';
import { Property } from '../types';
import { api } from '../services/api';

interface PropertyFilterState {
  property_type?: string;
  min_price?: number;
  max_price?: number;
  city?: string;
  sort_by?: string;
}

interface PropertyStoreState {
  properties: Property[];
  myListings: Property[];
  favorites: Property[];
  selectedProperty: Property | null;
  filters: PropertyFilterState;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  fetchProperties: () => Promise<void>;
  fetchPropertyDetails: (id: number) => Promise<Property>;
  fetchMyListings: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  createListing: (data: Partial<Property>) => Promise<Property>;
  updateListing: (id: number, data: Partial<Property>) => Promise<Property>;
  deleteListing: (id: number) => Promise<void>;
  toggleFavorite: (propertyId: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<PropertyFilterState>) => void;
  resetFilters: () => void;
}

export const usePropertyStore = create<PropertyStoreState>((set, get) => ({
  properties: [],
  myListings: [],
  favorites: [],
  selectedProperty: null,
  filters: { sort_by: 'newest' },
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchProperties: async () => {
    try {
      set({ isLoading: true, error: null });
      const { filters, searchQuery } = get();
      const params: Record<string, any> = { ...filters };
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      const data = await api.getProperties(params);
      set({ properties: data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Failed to fetch properties' });
    }
  },

  fetchPropertyDetails: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const property = await api.getProperty(id);
      set({ selectedProperty: property, isLoading: false });
      return property;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  fetchMyListings: async () => {
    try {
      set({ isLoading: true });
      const data = await api.getMyListings();
      set({ myListings: data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  fetchFavorites: async () => {
    try {
      set({ isLoading: true });
      const data = await api.getMyFavorites();
      set({ favorites: data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  createListing: async (propertyData: Partial<Property>) => {
    try {
      set({ isLoading: true, error: null });
      const newProperty = await api.createProperty(propertyData);
      set((state) => ({
        properties: [newProperty, ...state.properties],
        myListings: [newProperty, ...state.myListings],
        isLoading: false,
      }));
      return newProperty;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  updateListing: async (id: number, propertyData: Partial<Property>) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await api.updateProperty(id, propertyData);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? updated : p)),
        myListings: state.myListings.map((p) => (p.id === id ? updated : p)),
        selectedProperty: state.selectedProperty?.id === id ? updated : state.selectedProperty,
        isLoading: false,
      }));
      return updated;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  deleteListing: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await api.deleteProperty(id);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        myListings: state.myListings.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  toggleFavorite: async (propertyId: number) => {
    try {
      const res = await api.toggleFavorite(propertyId);
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId ? { ...p, is_favorited: res.is_favorited } : p
        ),
        selectedProperty:
          state.selectedProperty?.id === propertyId
            ? { ...state.selectedProperty, is_favorited: res.is_favorited }
            : state.selectedProperty,
      }));
      get().fetchFavorites();
    } catch (e: any) {
      console.warn('Error toggling favorite:', e);
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilters: (newFilters: Partial<PropertyFilterState>) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
  },

  resetFilters: () => {
    set({ filters: { sort_by: 'newest' }, searchQuery: '' });
  },
}));

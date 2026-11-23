import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { CallOverlay } from '../components/CallOverlay';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HomeScreen } from '../screens/marketplace/HomeScreen';
import { PropertyDetailScreen } from '../screens/marketplace/PropertyDetailScreen';
import { MapViewScreen } from '../screens/marketplace/MapViewScreen';
import { FavoritesScreen } from '../screens/marketplace/FavoritesScreen';
import { CreatePropertyScreen } from '../screens/management/CreatePropertyScreen';
import { MyListingsScreen } from '../screens/management/MyListingsScreen';
import { ConversationListScreen } from '../screens/chat/ConversationListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { CallHistoryScreen } from '../screens/calls/CallHistoryScreen';
import { MeetingRoomScreen } from '../screens/calls/MeetingRoomScreen';
import { ProfileScreen } from '../screens/account/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MarketplaceStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const CallsStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MarketplaceNavigator() {
  return (
    <MarketplaceStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketplaceStack.Screen name="MarketplaceHome" component={HomeScreen} />
      <MarketplaceStack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <MarketplaceStack.Screen name="MapView" component={MapViewScreen} />
    </MarketplaceStack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ConversationList" component={ConversationListScreen} />
      <ChatStack.Screen name="ChatDetail" component={ChatScreen} />
      <ChatStack.Screen name="MeetingRooms" component={MeetingRoomScreen} />
    </ChatStack.Navigator>
  );
}

function CallsNavigator() {
  return (
    <CallsStack.Navigator screenOptions={{ headerShown: false }}>
      <CallsStack.Screen name="CallHistory" component={CallHistoryScreen} />
      <CallsStack.Screen name="MeetingRooms" component={MeetingRoomScreen} />
    </CallsStack.Navigator>
  );
}

function MainTabNavigator() {
  const { role } = useAuthStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'map';
          if (route.name === 'MarketplaceTab') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'FavoritesTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'CreateTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'CallsTab') {
            iconName = focused ? 'call' : 'call-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceNavigator}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      {role !== 'buyer' && (
        <Tab.Screen
          name="CreateTab"
          component={CreatePropertyScreen}
          options={{ tabBarLabel: 'List Land' }}
        />
      )}
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="CallsTab"
        component={CallsNavigator}
        options={{ tabBarLabel: 'Calls' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavigationContainer>
        {isAuthenticated ? (
          <MainTabNavigator />
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>

      {/* Global Real-Time WebRTC Call Overlay */}
      <CallOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

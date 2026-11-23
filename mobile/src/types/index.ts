export type UserRole = 'buyer' | 'seller' | 'broker';

export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
  company_or_agency?: string;
  license_number?: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: UserProfile;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Property {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  price: number;
  price_unit: string;
  land_area: number;
  area_unit: string;
  property_type: 'residential' | 'agricultural' | 'commercial' | 'industrial';
  status: 'available' | 'pending' | 'sold';
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  zoning_classification?: string;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  owner?: User;
  is_favorited?: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'system';
  media_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface ConversationParticipant {
  id: number;
  user_id: number;
  joined_at: string;
  user?: User;
}

export interface Conversation {
  id: number;
  property_id?: number;
  title?: string;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message;
}

export interface CallRecord {
  id: number;
  caller_id: number;
  receiver_id: number;
  call_type: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'answered' | 'rejected' | 'missed' | 'ended';
  room_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at?: string;
  caller?: User;
  receiver?: User;
}

export interface MeetingRoom {
  id: number;
  code: string;
  title: string;
  host_id: number;
  property_id?: number;
  scheduled_for?: string;
  status: 'scheduled' | 'live' | 'concluded';
  created_at: string;
  host?: User;
}

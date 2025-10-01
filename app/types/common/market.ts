// Common types shared across the application

export interface MarketLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  postal_code?: string;
}

export interface Market {
  id: string;
  external_id: string;
  name: string;
  municipality?: string;
  category: string;
  start_date: string;
  end_date: string;
  address?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  organizer_name?: string;
  organizer_phone?: string;
  organizer_email?: string;
  organizer_website?: string;
  opening_hours?: string;
  entry_fee?: number;
  stall_count?: number;
  has_food: boolean;
  has_parking: boolean;
  has_toilets: boolean;
  has_wifi: boolean;
  is_indoor: boolean;
  is_outdoor: boolean;
  special_features?: string;
  source_url?: string;
  scraped_at: string;
  created_at: string;
  updated_at: string;
  distance?: number;
}
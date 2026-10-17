export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = {
  id: string;
  resident_code: string;
  full_name: string;
  township: string;
  verified_at: string | null;
  total_saved_rm: number;
  total_co2_kg: number;
  completed_borrows: number;
  avatar_url?: string | null;
};

export type Item = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  condition_score: number;
  retail_price_rm: number;
  co2_per_borrow_kg: number;
  shed_name: string;
  distance_m: number;
  locker_bay: string;
  status: 'Available' | 'Reserved' | 'In Use';
  kit_contents: string | null;
  image_url: string | null;
  total_loans: number;
};

export type Locker = {
  bay_code: string;
  shed_name: string;
  is_unlocked: boolean;
  battery_charge_pct: number;
  last_updated: string;
};

export type Loan = {
  id: string;
  resident_id: string;
  item_id: string;
  locker_bay: string;
  start_date: string;
  end_date: string;
  status: 'RESERVED' | 'ACTIVE' | 'RETURNED';
  qr_token: string;
  collected_at: string | null;
  returned_at: string | null;
  working_well: boolean | null;
  all_parts_included: boolean | null;
  return_photo_url: string | null;
  ai_verification_json: Record<string, unknown> | null;
  return_condition_score: number | null;
};

export type SkillHelper = {
  id: string;
  full_name: string;
  skills: string[];
  rating: number;
  helps_count: number;
  distance_m: number;
  availability_badge: string;
  avatar_url: string | null;
};

export type AssistanceRequest = {
  id: string;
  resident_id: string;
  helper_id: string;
  item_id: string | null;
  message: string;
  status: 'PENDING' | 'ACCEPTED';
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      items: {
        Row: Item;
        Insert: Partial<Item>;
        Update: Partial<Item>;
        Relationships: [];
      };
      lockers: {
        Row: Locker;
        Insert: Partial<Locker>;
        Update: Partial<Locker>;
        Relationships: [];
      };
      loans: {
        Row: Loan;
        Insert: Partial<Loan>;
        Update: Partial<Loan>;
        Relationships: [];
      };
      skill_helpers: {
        Row: SkillHelper;
        Insert: Partial<SkillHelper>;
        Update: Partial<SkillHelper>;
        Relationships: [];
      };
      assistance_requests: {
        Row: AssistanceRequest;
        Insert: Partial<AssistanceRequest>;
        Update: Partial<AssistanceRequest>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

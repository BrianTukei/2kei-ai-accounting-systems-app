import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Receipt = {
  id: string;
  user_id: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  description: string;
  items: any;
  subtotal: number;
  tax_amount: number;
  receipt_number: string;
  payment_method: string;
  confidence_score: number;
  image_url: string;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};
import { createClient } from '@supabase/supabase-js';

// Lovable Cloud automatically injects these credentials
const supabaseUrl = "https://uufqnrwqxxrhxfqmilqd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZnFucndxeHhyaHhmcW1pbHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzc3NTMsImV4cCI6MjA3NDgxMzc1M30.YMWfWZyG_vY4EcuLRy6d1vGsIkPQMQ-HzJPgbFOWLPA";

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
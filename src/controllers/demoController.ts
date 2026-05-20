import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { sendDemoConfirmation, sendDemoNotification, sendBookingStatusUpdate, sendRescheduleNotification } from '../services/demoService';
import { logger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
let supabase: any = null;

// Only initialize Supabase client if credentials are available
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const ensureSupabaseConfigured = (res: Response) => {
  if (supabase) {
    return true;
  }

  res.status(503).json({
    success: false,
    error: 'Supabase is not configured. Demo booking is temporarily unavailable.',
    details: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) in .env.local.'
  });

  return false;
};

const formatSupabaseError = (error: any) => {
  const rawMessage = error?.message || 'Unknown Supabase error';
  const details = error?.details || error?.hint || undefined;

  if (typeof rawMessage === 'string') {
    if (rawMessage.includes('relation') && rawMessage.includes('does not exist')) {
      return {
        error: 'Supabase table is missing for demo bookings.',
        details: 'Create demo_bookings, users, and companies tables or run migrations.'
      };
    }

    if (rawMessage.toLowerCase().includes('permission denied') || rawMessage.toLowerCase().includes('not allowed')) {
      return {
        error: 'Supabase permission denied while booking demo.',
        details: 'Check RLS policies and service role key permissions.'
      };
    }
  }

  return {
    error: rawMessage,
    details
  };
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    if (!ensureSupabaseConfigured(res)) {
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      email,
      company,
      phone,
      website,
      preferredDate,
      preferredTime,
      message,
      timezone = 'UTC',
      source = 'website'
    } = req.body;

    // Check if slot exists in DB
    const { data: existingBooking, error: existingBookingError } = await supabase
      .from('demo_bookings')
      .select('id')
      .eq('preferred_date', preferredDate.split('T')[0])
      .eq('preferred_time', preferredTime)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (existingBookingError) {
      const formatted = formatSupabaseError(existingBookingError);
      return res.status(500).json({
        success: false,
        error: formatted.error,
        details: formatted.details
      });
    }

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please select a different time.'
      });
    }

    // 1. Get or create user
    let { data: user, error: userLookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userLookupError) {
      const formatted = formatSupabaseError(userLookupError);
      return res.status(500).json({
        success: false,
        error: formatted.error,
        details: formatted.details
      });
    }
    
    if (!user) {
      const { data: newUser, error: userError } = await supabase.from('users').insert({
        id: uuidv4(),
        email,
        full_name: name,
        role: 'user',
        status: 'active'
      }).select('id').single();
      
      if (userError) {
        const formatted = formatSupabaseError(userError);
        return res.status(500).json({
          success: false,
          error: formatted.error,
          details: formatted.details
        });
      }
      user = newUser;
    }

    // 2. Get or create company
    let { data: companyRecord, error: companyLookupError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', company)
      .maybeSingle();

    if (companyLookupError) {
      const formatted = formatSupabaseError(companyLookupError);
      return res.status(500).json({
        success: false,
        error: formatted.error,
        details: formatted.details
      });
    }

    if (!companyRecord) {
      const { data: newCompany, error: companyError } = await supabase.from('companies').insert({
        id: uuidv4(),
        name: company,
        website: website || null,
        status: 'active'
      }).select('id').single();

      if (companyError) {
        const formatted = formatSupabaseError(companyError);
        return res.status(500).json({
          success: false,
          error: formatted.error,
          details: formatted.details
        });
      }
      companyRecord = newCompany;
    }

    // 3. Create demo booking
    const { data: booking, error: bookingError } = await supabase.from('demo_bookings').insert({
      id: uuidv4(),
      user_id: user.id,
      company_id: companyRecord.id,
      preferred_date: preferredDate.split('T')[0],
      preferred_time: preferredTime,
      timezone,
      status: 'pending',
      meeting_platform: 'zoom',
      duration: 30,
      metadata: {
        message, source, phone
      }
    }).select().single();

    if (bookingError) {
      const formatted = formatSupabaseError(bookingError);
      return res.status(500).json({
        success: false,
        error: formatted.error,
        details: formatted.details
      });
    }

    // Send notifications
    try {
      // Create mock booking object expected by email service
      const mockBooking = {
        _id: booking.id,
        name,
        email,
        company,
        preferredDate: new Date(preferredDate),
        preferredTime,
        status: 'pending'
      };
      await sendDemoConfirmation(mockBooking as any);
      await sendDemoNotification(mockBooking as any);
    } catch (e) {
      logger.error('Email sending failed', e);
    }

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Demo booking created successfully!'
    });
  } catch (error) {
    const formatted = formatSupabaseError(error);
    logger.error('Failed to create demo booking:', error);
    res.status(500).json({
      success: false,
      error: formatted.error,
      details: formatted.details
    });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    if (!ensureSupabaseConfigured(res)) {
      return;
    }

    const { date, timezone = 'UTC', duration = 30 } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'Date required' });

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.json({ success: true, data: { availableSlots: [] } });
    }

    const { data: existing, error: existingError } = await supabase
      .from('demo_bookings')
      .select('preferred_time')
      .eq('preferred_date', targetDate.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed']);

    if (existingError) {
      const formatted = formatSupabaseError(existingError);
      return res.status(500).json({
        success: false,
        error: formatted.error,
        details: formatted.details
      });
    }

    const bookedTimes = new Set((existing || []).map(b => b.preferred_time));
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!bookedTimes.has(timeString)) {
          slots.push({ date: targetDate, time: timeString, duration: 30, isAvailable: true, timezone });
        }
      }
    }
    
    res.json({ success: true, data: { availableSlots: slots } });
  } catch (error) {
    const formatted = formatSupabaseError(error);
    logger.error('Failed to fetch available slots:', error);
    res.status(500).json({
      success: false,
      error: formatted.error,
      details: formatted.details
    });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { data, count, error } = await supabase.from('demo_bookings').select('*, users(email, full_name), companies(name)', { count: 'exact' });
    if (error) throw error;
    res.json({ success: true, data: { bookings: data, pagination: { total: count || 0 } } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Not implemented' });
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Not implemented' });
};

export const deleteBooking = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Not implemented' });
};

export const getBookingStats = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Not implemented' });
};

export const rescheduleBooking = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'Not implemented' });
};

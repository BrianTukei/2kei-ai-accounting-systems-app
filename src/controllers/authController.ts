import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase, isSupabaseConfigured } from '../integrations/supabase/serverClient';

/**
 * Auth Controller
 * Handles user authentication, registration, and token management
 * Uses Supabase for all authentication and data storage
 */

export class AuthController {
  /**
   * Check if Supabase is properly configured
   */
  private static checkSupabaseConfig(res: Response): boolean {
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured - missing environment variables');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please check server configuration.',
        details: 'Supabase credentials not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
      }) as any;
    }
    return true;
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      // Check Supabase configuration
      if (!this.checkSupabaseConfig(res)) return;

      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('Login error:', error?.message);
        return res.status(401).json({
          success: false,
          message: error?.message || 'Invalid email or password',
        });
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      console.log(`✅ User logged in: ${email}`);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            firstName: userProfile?.first_name || '',
            lastName: userProfile?.last_name || '',
            ...userProfile,
          },
          token: data.session?.access_token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      // Check Supabase configuration
      if (!this.checkSupabaseConfig(res)) return;

      const { firstName, lastName, email, password, phone } = req.body;

      // Validate input
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'First name, last name, email, and password are required',
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          },
        },
      });

      if (error || !data.user) {
        console.error('Registration error:', error?.message);
        return res.status(400).json({
          success: false,
          message: error?.message || 'Registration failed',
        });
      }

      // Create user profile in users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      console.log(`✅ User registered: ${email}`);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            firstName,
            lastName,
            ...userProfile,
          },
          token: data.session?.access_token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getProfile(req: Request, res: Response) {
    try {
      // Check Supabase configuration
      if (!this.checkSupabaseConfig(res)) return;

      // Get user from request (set by auth middleware)
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            ...user,
          },
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred',
      });
    }
  }
}

export default AuthController;

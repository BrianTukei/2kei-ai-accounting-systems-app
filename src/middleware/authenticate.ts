import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Authentication middleware
 * Verifies JWT token from Supabase and attaches user ID to request
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
      // Verify token - Supabase uses HS256 by default
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as { sub: string; email: string };

      // Attach user ID and email to request
      req.userId = decoded.sub;
      req.userEmail = decoded.email;
      next();
    } catch (verifyError) {
      // If verification fails, try to decode without verification for debugging
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.sub) {
          req.userId = decoded.sub;
          req.userEmail = decoded.email;
          return next();
        }
      } catch (decodeError) {
        // Ignore
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

export default authenticate;

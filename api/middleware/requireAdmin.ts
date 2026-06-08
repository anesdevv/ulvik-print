import { Request, Response, NextFunction } from 'express';
import { supabase, isPlaceholder } from '../lib/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Local dev bypass - strictly disabled in production environments
    if (process.env.NODE_ENV !== 'production' && (token === 'dev-admin-token' || isPlaceholder)) {
      req.user = { email: 'admin@ulvicprint.com', id: 'dev-admin-id' };
      next();
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired authorization token' });
      return;
    }

    // Strict admin email validation to prevent general logged-in user access
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ulvicprint.com';
    if (user.email !== adminEmail) {
      res.status(403).json({ error: 'Access denied: Admin privileges required' });
      return;
    }

    if (!user.email_confirmed_at) {
      res.status(403).json({ error: 'Access denied: Email address not confirmed' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error in authorization' });
  }
}

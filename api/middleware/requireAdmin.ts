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

    // Local dev bypass
    if (token === 'dev-admin-token' || isPlaceholder) {
      req.user = { email: 'admin@ulvikprint.com', id: 'dev-admin-id' };
      next();
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired authorization token' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error in authorization' });
  }
}

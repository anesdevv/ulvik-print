import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

export const isPlaceholder = 
  supabaseUrl.includes('placeholder.supabase.co') || 
  supabaseServiceKey === 'placeholder-service-role-key';

if (isPlaceholder) {
  console.warn(
    'Running API in placeholder/mock mode. Database writes will be stored in memory and reset on server restarts.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

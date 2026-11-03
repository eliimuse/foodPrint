import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lhbjaoergruaohbbague.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mi9bRoEpVauy0JT6BAsSrA_8UQPZnCz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealth {
  isConfigured: boolean;
  isConnected: boolean;
  tablesExist: boolean;
  lastChecked: string;
  errorMessage?: string;
}

/**
 * Checks if the Supabase project is reachable and if tables are provisioned.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  try {
    const { error } = await supabase.from('menu_items').select('id').limit(1);
    
    if (error) {
      // 42P01 means table does not exist yet (user hasn't run the SQL script yet)
      const isMissingTable = error.code === '42P01' || error.message?.includes('relation "public.menu_items" does not exist') || error.code === 'PGRST204';
      return {
        isConfigured: true,
        isConnected: true,
        tablesExist: !isMissingTable,
        lastChecked: new Date().toISOString(),
        errorMessage: isMissingTable 
          ? 'Tables not yet created in Supabase. Run the SQL schema script in your Supabase SQL Editor.'
          : error.message,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      tablesExist: true,
      lastChecked: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      tablesExist: false,
      lastChecked: new Date().toISOString(),
      errorMessage: err?.message || 'Network connection to Supabase failed.',
    };
  }
}

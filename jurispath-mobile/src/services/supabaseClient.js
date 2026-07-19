import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://xqtooaaoliggkowrcsac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdG9vYWFvbGlnZ2tvd3Jjc2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Nzc3NzAsImV4cCI6MjA5ODQ1Mzc3MH0.3G_jr9O_PXHKOXly60eGIVzdYSDExHBILi98JQvshqk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

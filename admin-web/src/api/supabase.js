import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjoojbvbugfxkhjiqlun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb29qYnZidWdmeGtoamlxbHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MTQ3NjcsImV4cCI6MjA4NTQ5MDc2N30.7SsFg6ByBGmgqXRpgkRhcGU_PBt_k14_fazxebGz8sQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

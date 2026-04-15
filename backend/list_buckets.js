const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kjoojbvbugfxkhjiqlun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb29qYnZidWdmeGtoamlxbHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MTQ3NjcsImV4cCI6MjA4NTQ5MDc2N30.7SsFg6ByBGmgqXRpgkRhcGU_PBt_k14_fazxebGz8sQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) { console.error(error); return; }
  console.log('Buckets:', data.map(b => b.name));
}

listBuckets();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kjoojbvbugfxkhjiqlun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb29qYnZidWdmeGtoamlxbHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MTQ3NjcsImV4cCI6MjA4NTQ5MDc2N30.7SsFg6ByBGmgqXRpgkRhcGU_PBt_k14_fazxebGz8sQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
  const { data, error } = await supabase.storage.from('cakes').list('', { 
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' } 
  });
  if (error) { console.error(error); return; }
  
  const files = data.map(file => {
    const { data: { publicUrl } } = supabase.storage.from('cakes').getPublicUrl(file.name);
    return { name: file.name, url: publicUrl, created_at: file.created_at };
  });
  
  fs.writeFileSync('supabase_data.json', JSON.stringify(files, null, 2));
  console.log('Done, saved to supabase_data.json');
}

listFiles();

const SUPABASE_URL = 'https://fiesvhdryxeellomdfun.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZXN2aGRyeXhlZWxsb21kZnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU4ODIsImV4cCI6MjA2OTI3MTg4Mn0.Eg2RO7ogsLkuzH5uktvDrgf7PYEhNuXCd6atBajESEk';

console.log("window.supabase before createClient:", window.supabase);
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
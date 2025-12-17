import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuración
const SUPABASE_URL = "https://iqepyjqlnlbwtuehrngr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZXB5anFsbmxid3R1ZWhybmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTg2MDQsImV4cCI6MjA3OTkzNDYwNH0.C-WwzpilT9jUsVXhoOLjDiVJrkcnfl7XsBxIZLba1K4";

// Crear y exportar cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Probar conexión
supabaseClient
  .from('estudiantes')
  .select('*')
  .then(response => {
    console.log('Conexión exitosa:', response.data);
  });

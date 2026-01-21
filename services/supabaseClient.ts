
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tbmntukqxrvhljvczmxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibW50dWtxeHJ2aGxqdmN6bXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDM4NTMsImV4cCI6MjA4NDUxOTg1M30.SGMSIl92W2V1LeQJB3-vyWL9BZXFjTszuI9tUySV8bY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

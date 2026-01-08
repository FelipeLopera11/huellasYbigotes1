import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://sqptzzuzdxpygxnmhivy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHR6enV6ZHhweWd4bm1oaXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTIxNDAsImV4cCI6MjA4MzEyODE0MH0.WvxJrIyKcPePwHBnOzHTOV8xpvlEg0PEiM8mw2DpyrE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);



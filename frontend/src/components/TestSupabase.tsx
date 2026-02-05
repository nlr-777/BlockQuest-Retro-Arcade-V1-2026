import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      console.log('SUPABASE HANDSHAKE:', { data, error });
    }
    test();
  }, []);

  return null; // renders nothing
}

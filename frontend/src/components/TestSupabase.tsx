import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  useEffect(() => {
    async function test() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        console.log('SUPABASE HANDSHAKE:', { data, error });
      } catch (err) {
        console.log('SUPABASE NOT READY:', err);
      }
    }

    test();
  }, []);

  return null;
}

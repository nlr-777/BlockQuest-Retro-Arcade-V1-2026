import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .limit(1);

      console.log('SUPABASE HANDSHAKE:', { data, error });
    }

    test();
  }, []);

  return null;
}

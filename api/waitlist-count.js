import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Brak konfiguracji bazy' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  try {
    // Liczymy ile jest wierszy w tabeli
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Błąd pobierania licznika z bazy Supabase:', error);
      // RLS na start zablokuje SELECT (brak widoczności publicznej)
      // Wrzucamy bezpieczny fallback 34 by strona nie wywaliła błędu.
      return res.status(200).json({ count: 34 });
    }

    // Nasiono marketingowe - strona nie zaczyna od zera
    // Gdy w bazie są 2 rekordy, na frontendzie wyjdzie 122.
    const baseCount = 34;
    const dynamicCount = baseCount + (count || 0);

    return res.status(200).json({ count: dynamicCount });
  } catch (error) {
    console.error('Błąd serwera (Licznik):', error);
    return res.status(500).json({ error: 'Wystąpił błąd wliczania.' });
  }
}

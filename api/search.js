const { createClient } = require('@supabase/supabase-js');
const Fuse = require('fuse.js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, offset = 0, featured } = req.query;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase keys are missing!" });
  }

  try {

    // ✅ NAYA: featured=true ho to featured_novels table se random novel do
    if (featured === 'true') {
      const { data, error } = await supabase
        .from('featured_novels')
        .select('title, link');

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      // Server side random pick — ek random novel return karo
      const pick = data[Math.floor(Math.random() * data.length)];

      return res.status(200).json({
        data: [{ Titles: pick.title, Links: pick.link }],
        total: data.length   // total count bhi bhejo (optional use ke liye)
      });
    }

    // ─── BAQI SARI API BILKUL PEHLE JAISI HAI ────────────────────────────

    if (query) {
      const cleanQuery = query.trim();

      const { data: exactData, error: exactError } = await supabase
        .from('urdu_novels')
        .select('*')
        .ilike('Titles', `%${cleanQuery}%`) 
        .limit(30);

      if (exactData && exactData.length > 0) {
         const formattedExact = exactData.map(row => ({
            Titles: row.titles || row.Titles || "",
            Links: row.links || row.Links || "#"
         }));
         return res.status(200).json({ data: formattedExact, total: formattedExact.length });
      }

      const { data: results, error } = await supabase
        .rpc('search_novels_fuse', { search_term: cleanQuery });

      if (error) throw error;

      if (!results || results.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      const booksPool = results.map(row => ({
        Titles: row.titles || row.Titles || "",
        Links: row.links || row.Links || "#"
      }));

      const fuse = new Fuse(booksPool, {
        keys: ['Titles'],
        threshold: 0.4,
        distance: 100,
        location: 0,
        minMatchCharLength: 2,
        findAllMatches: true
      });

      const fuseResults = fuse.search(cleanQuery);

      const finalResponse = fuseResults.map(r => ({
         Titles: r.item.Titles,
         Links: r.item.Links
      }));

      return res.status(200).json({ 
        data: finalResponse, 
        total: finalResponse.length 
      });

    } else {
      const start = parseInt(offset) || 0;
      const end = start + 20;

      const { data, error, count } = await supabase
        .from('urdu_novels')
        .select('*', { count: 'exact' })
        .range(start, end);

      if (error) throw error;

      const formatted = (data || []).map(row => ({
        Titles: row.Titles || row.titles || "",
        Links: row.Links || row.links || "#"
      }));

      return res.status(200).json({ data: formatted, total: count });
    }

  } catch (error) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
};
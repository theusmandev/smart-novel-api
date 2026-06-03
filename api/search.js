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

  const { query, offset = 0 } = req.query;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase keys are missing!" });
  }

  try {
    if (query) {
      const cleanQuery = query.trim();

      // 🌟 STEP 1: DIRECT EXACT / SUBSTRING MATCH (Bypasses Fuzzy Limits for Long Titles)
      // Note: Make sure 'Titles' matches your exact column name in Supabase (Titles or titles)
      const { data: exactData, error: exactError } = await supabase
        .from('urdu_novels')
        .select('*')
        .ilike('Titles', `%${cleanQuery}%`) 
        .limit(30);

      if (exactData && exactData.length > 0) {
         // Agar exact title mil gaya, toh directly send kar do
         const formattedExact = exactData.map(row => ({
            Titles: row.titles || row.Titles || "",
            Links: row.links || row.Links || "#"
         }));
         return res.status(200).json({ data: formattedExact, total: formattedExact.length });
      }

      // 🌟 STEP 2: FUZZY SEARCH FALLBACK (If exact match fails)
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

      // EXACT ORIGINAL FRONT-END FUSE.JS CONFIGURATION
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
      // Normal Pagination Logic
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
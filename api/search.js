const { createClient } = require('@supabase/supabase-js');
const Fuse = require('fuse.js'); // Actual Fuse.js Import!

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async (req, res) => {
  // Blogger ke liye CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, offset = 0 } = req.query;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase keys missing in Vercel!" });
  }

  try {
    if (query) {
      const cleanQuery = query.trim();

      // 1. Supabase se loose candidates fetch karna
      const { data: results, error } = await supabase
        .rpc('search_novels_intent', { search_term: cleanQuery });

      if (error) throw error;

      if (!results || results.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      // 2. Data normalise karna Fuse ke liye
      const booksPool = results.map(row => ({
        Titles: row.Titles || row.titles || "",
        Links: row.Links || row.links || "#"
      }));

      // 3. EXACT FRONT-END FUSE.JS LOGIC ON BACK-END
      const fuseOptions = {
        keys: ['Titles'],
        threshold: 0.5,       // Balance between strict and very fuzzy
        distance: 100,
        ignoreLocation: true  // Pure string comparison bina position constraint ke
      };

      const fuse = new Fuse(booksPool, fuseOptions);
      const fuseResults = fuse.search(cleanQuery);

      // Raw array format mein convert karna jaisa website ko chahiye
      const finalResponse = fuseResults.map(r => r.item);

      return res.status(200).json({ 
        data: finalResponse, 
        total: finalResponse.length 
      });

    } else {
      // Library view Pagination logic
      const start = parseInt(offset) || 0;
      const end = start + 20;

      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .range(start, end);

      if (error) throw error;

      const formatted = (data || []).map(row => ({
        Titles: row.Titles || row.titles,
        Links: row.Links || row.links
      }));

      return res.status(200).json({ data: formatted, total: 78500 });
    }
  } catch (error) {
    return res.status(500).json({ error: 'FUSE_ENGINE_ERROR', message: error.message });
  }
};
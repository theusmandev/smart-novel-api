const { createClient } = require('@supabase/supabase-js');
const Fuse = require('fuse.js'); // Real Fuse.js Engine Import

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
    return res.status(500).json({ error: "Supabase keys are missing in Vercel!" });
  }

  try {
    if (query) {
      const cleanQuery = query.trim();

      // 1. Supabase Dynamic RPC se loose candidates fetch karna (No Column Crash)
      const { data: results, error } = await supabase
        .rpc('search_novels_fuse', { search_term: cleanQuery });

      if (error) throw error;

      if (!results || results.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      // 2. Data pool ko Fuse.js ke standard format mein normalize karna
      const booksPool = results.map(row => ({
        Titles: row.titles || "",
        Links: row.links || "#"
      }));

      // 3. EXACT PURANI FRONT-END FUSE.JS CONFIGURATION
      const fuse = new Fuse(booksPool, {
        keys: ['Titles'],
        threshold: 0.3,        // Typos aur partial searches ka perfect balance
        distance: 100,
        location: 0,
        minMatchCharLength: 2
      });

      const fuseResults = fuse.search(cleanQuery);

      // 4. Clean output array banana jaisa Blogger frontend ko chahiye
      const finalResponse = fuseResults.map(r => ({
         Titles: r.item.Titles,
         Links: r.item.Links
      }));

      return res.status(200).json({ 
        data: finalResponse, 
        total: finalResponse.length 
      });

    } else {
      // Normal Library view Pagination logic
      const start = parseInt(offset) || 0;
      const end = start + 20;

      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .range(start, end);

      if (error) throw error;

      const formatted = (data || []).map(row => ({
        Titles: row.Titles || row.titles || "",
        Links: row.Links || row.links || "#"
      }));

      return res.status(200).json({ data: formatted, total: 78500 });
    }
  } catch (error) {
    return res.status(500).json({ error: 'FUSE_SERVER_ERROR', message: error.message });
  }
};
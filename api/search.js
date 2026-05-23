const { createClient } = require('@supabase/supabase-js');
const Fuse = require('fuse.js');

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseUrl = 'https://tfmorbaldfhkcvizdwya.supabase.co';
const supabaseAnonKey = 'sb_publishable_KfsoNXGMJa4nSCb7KGR0oA_t-GdreDk';


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
    return res.status(500).json({ error: "Supabase keys are missing in Vercel!" });
  }

  try {
    if (query) {
      const cleanQuery = query.trim();

      // 1. Database se unique tokenized candidates uthana
      const { data: results, error } = await supabase
        .rpc('search_novels_fuse', { search_term: cleanQuery });

      if (error) throw error;

      if (!results || results.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      // 2. Format pool for Fuse.js
      const booksPool = results.map(row => ({
        Titles: row.titles || row.Titles || "",
        Links: row.links || row.Links || "#"
      }));

      // 3. EXACT ORIGINAL FRONT-END FUSE.JS CONFIGURATION
      const fuse = new Fuse(booksPool, {
        keys: ['Titles'],
        threshold: 0.4,        // Pure frontend fuzzy threshold
        distance: 100,
        location: 0,
        minMatchCharLength: 2,
        findAllMatches: true
      });

      const fuseResults = fuse.search(cleanQuery);

      // 4. Map output to original array format
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

      // 🚀 YAHAN CHANGE KIYA HAI: 'novels' se 'urdu_novels' kar diya
      const { data, error } = await supabase
        .from('urdu_novels')
        .select('*')
        .range(start, end);

      if (error) throw error;

      const formatted = (data || []).map(row => ({
        Titles: row.Titles || row.titles || "",
        Links: row.Links || row.links || "#"
      }));

      // (Optional) Aap chahay to total count ko dynamic bhi kar sakte hain
      return res.status(200).json({ data: formatted, total: 78500 });
    }
  } catch (error) {
    return res.status(500).json({ error: 'FUSE_SERVER_ERROR', message: error.message });
  }
};
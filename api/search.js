const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async (req, res) => {
  // CORS Headers for Blogger
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
      const words = cleanQuery.split(/\s+/).filter(w => w.length > 0);

      // FUSE.JS LOGIC: Har word ke liye ILIKE query generate karna
      const orFilter = words.map(w => `"Titles".ilike.%${w}%`).join(',');
      
      let { data: results, error } = await supabase
        .from('novels')
        .select('*')
        .or(orFilter)
        .limit(100);

      // Fallback: Agar database mein column name small lowercase 'titles' ho
      if (error) {
        const orFilterSmall = words.map(w => `titles.ilike.%${w}%`).join(',');
        const retry = await supabase.from('novels').select('*').or(orFilterSmall).limit(100);
        results = retry.data;
        if (retry.error) throw new Error(retry.error.message);
      }

      if (!results || results.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      // --- FUSE.JS ALGORITHM SIMULATION ---
      const scoredData = results.map(row => {
        const title = row.Titles || row.titles || "";
        const titleLower = title.toLowerCase();
        const queryLower = cleanQuery.toLowerCase();
        
        let score = 0;

        if (titleLower === queryLower) score += 1000; // Exact match score
        if (titleLower.includes(queryLower)) score += 500; // Phrase sequence score

        words.forEach(word => {
          if (titleLower.includes(word.toLowerCase())) {
            score += 100; // Individual word match
            if (titleLower.startsWith(word.toLowerCase())) {
              score += 40; // Starts with bonus
            }
          }
        });

        return {
          Titles: title,
          Links: row.Links || row.links || "#",
          score: score
        };
      });

      // Highest score wale novels ko sab se upar sort karna
      scoredData.sort((a, b) => b.score - a.score);

      // Clean response (score property hata kar purane format mein bhejna)
      const finalResponse = scoredData.map(item => ({ Titles: item.Titles, Links: item.Links }));

      return res.status(200).json({ data: finalResponse, total: finalResponse.length });

    } else {
      // Normal View Pagination
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
    return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
};
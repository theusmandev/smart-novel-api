
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

  // ✅ NAYA: URL parameters (GET) aur Body (POST) dono se data utha lo taake 5000 novels par crash na ho
  const query = req.query.query || (req.body && req.body.query);
  const offset = req.query.offset || (req.body && req.body.offset) || 0;
  const featured = req.query.featured || (req.body && req.body.featured);
  const seen = req.query.seen || (req.body && req.body.seen);

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase keys are missing!" });
  }

  try {

    // ✅ NAYA: featured=true ho to featured_novels table se novel do (with No-Repeat Logic)
    if (featured === true || featured === 'true') {
      const { data, error } = await supabase
        .from('featured_novels')
        .select('Titles, Links');

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(200).json({ data: [], total: 0 });
      }

      let availableNovels = data;
      let wasReset = false;

      // Agar frontend ne bataya hai ke user yeh novels dekh chuka hai (via POST Body or GET query)
      if (seen) {
          let seenList = [];
          
          // Check: Agar JSON body mein array aya hai (POST) toh direct use karo, warna parse karo (GET)
          if (Array.isArray(seen)) {
              seenList = seen;
          } else {
              try {
                  seenList = JSON.parse(decodeURIComponent(seen));
              } catch(e) {
                  console.error("Seen list parsing error", e);
              }
          }

          // Jo novels pehle dekh liye gaye hain unko list se nikal do
          availableNovels = data.filter(novel => !seenList.includes(novel.Titles));
          
          // Agar user saare featured novels dekh chuka hai, toh list wapas shuru se reset kar do
          if (availableNovels.length === 0) {
              availableNovels = data; 
              wasReset = true;
          }
      }

      // Available novels mein se Server side random pick karo
      const pick = availableNovels[Math.floor(Math.random() * availableNovels.length)];

      return res.status(200).json({
        data: [{ Titles: pick.Titles, Links: pick.Links }],
        total: data.length,
        reset: wasReset // Frontend ko batane ke liye ke list reset ho gayi hai
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

















// const { createClient } = require('@supabase/supabase-js');
// const Fuse = require('fuse.js');

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// module.exports = async (req, res) => {
//   // CORS Headers
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') return res.status(200).end();

//   const { query, offset = 0, featured, seen } = req.query;

//   if (!supabaseUrl || !supabaseAnonKey) {
//     return res.status(500).json({ error: "Supabase keys are missing!" });
//   }

//   try {

//     // ✅ NAYA: featured=true ho to featured_novels table se novel do (with No-Repeat Logic)
//     if (featured === 'true') {
//       const { data, error } = await supabase
//         .from('featured_novels')
//         .select('Titles, Links');

//       if (error) throw error;
//       if (!data || data.length === 0) {
//         return res.status(200).json({ data: [], total: 0 });
//       }

//       let availableNovels = data;
//       let wasReset = false;

//       // Agar frontend ne bataya hai ke user yeh novels dekh chuka hai
//       if (seen) {
//           try {
//               const seenList = JSON.parse(decodeURIComponent(seen));
//               // Jo novels pehle dekh liye gaye hain unko list se nikal do
//               availableNovels = data.filter(novel => !seenList.includes(novel.Titles));
              
//               // Agar user saare featured novels dekh chuka hai, toh list wapas shuru se reset kar do
//               if (availableNovels.length === 0) {
//                   availableNovels = data; 
//                   wasReset = true;
//               }
//           } catch(e) {
//               console.error("Seen list parsing error", e);
//           }
//       }

//       // Available novels mein se Server side random pick karo
//       const pick = availableNovels[Math.floor(Math.random() * availableNovels.length)];

//       return res.status(200).json({
//         data: [{ Titles: pick.Titles, Links: pick.Links }],
//         total: data.length,
//         reset: wasReset // Frontend ko batane ke liye ke list reset ho gayi hai
//       });
//     }

//     // ─── BAQI SARI API BILKUL PEHLE JAISI HAI ────────────────────────────

//     if (query) {
//       const cleanQuery = query.trim();

//       const { data: exactData, error: exactError } = await supabase
//         .from('urdu_novels')
//         .select('*')
//         .ilike('Titles', `%${cleanQuery}%`) 
//         .limit(30);

//       if (exactData && exactData.length > 0) {
//          const formattedExact = exactData.map(row => ({
//             Titles: row.titles || row.Titles || "",
//             Links: row.links || row.Links || "#"
//          }));
//          return res.status(200).json({ data: formattedExact, total: formattedExact.length });
//       }

//       const { data: results, error } = await supabase
//         .rpc('search_novels_fuse', { search_term: cleanQuery });

//       if (error) throw error;

//       if (!results || results.length === 0) {
//         return res.status(200).json({ data: [], total: 0 });
//       }

//       const booksPool = results.map(row => ({
//         Titles: row.titles || row.Titles || "",
//         Links: row.links || row.Links || "#"
//       }));

//       const fuse = new Fuse(booksPool, {
//         keys: ['Titles'],
//         threshold: 0.4,
//         distance: 100,
//         location: 0,
//         minMatchCharLength: 2,
//         findAllMatches: true
//       });

//       const fuseResults = fuse.search(cleanQuery);

//       const finalResponse = fuseResults.map(r => ({
//          Titles: r.item.Titles,
//          Links: r.item.Links
//       }));

//       return res.status(200).json({ 
//         data: finalResponse, 
//         total: finalResponse.length 
//       });

//     } else {
//       const start = parseInt(offset) || 0;
//       const end = start + 20;

//       const { data, error, count } = await supabase
//         .from('urdu_novels')
//         .select('*', { count: 'exact' })
//         .range(start, end);

//       if (error) throw error;

//       const formatted = (data || []).map(row => ({
//         Titles: row.Titles || row.titles || "",
//         Links: row.Links || row.links || "#"
//       }));

//       return res.status(200).json({ data: formatted, total: count });
//     }

//   } catch (error) {
//     return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
//   }
// };
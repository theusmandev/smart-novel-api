# Smart Novel API 

A high-performance, serverless backend API built to serve the **Smart Urdu Novel Bank**. It provides a blazing-fast, typo-tolerant fuzzy search experience across a massive database of 78,000+ Urdu novels.

##  Features

* **Advanced Fuzzy Search:** Utilizes PostgreSQL `pg_trgm` (Trigram) and custom Regex-based SQL functions to handle spelling mistakes and Roman Urdu typos efficiently.
* **Serverless Architecture:** Hosted on Vercel Serverless Functions for zero-maintenance scaling and lightning-fast response times.
* **Dynamic Pagination:** Efficiently loads novels in chunks (20 per page) with an exact dynamic total count.
* **CORS Enabled:** Fully configured to accept requests from the frontend client seamlessly.

## Tech Stack

* **Hosting:** Vercel (Serverless Node.js Functions)
* **Database:** Supabase (PostgreSQL)
* **Search Logic:** Custom PL/pgSQL & `pg_trgm` indexing
* **Package Manager:** npm

##  API Endpoints

### 1. Get All Novels (Pagination)
Fetches a chunk of novels for the library feed.
* **URL:** `/api/search?offset={number}`
* **Method:** `GET`
* **Response:**
  ```json
  {
    "data": [
      {
        "Titles": "Novel Name",
        "Links": "https://..."
      }
    ],
    "total": 78542
  }

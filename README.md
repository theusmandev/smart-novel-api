

# Smart Novel API

**A blazing-fast, dual-layer fuzzy search API with dynamic pagination for the Smart Urdu Novel Bank.**

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node-dot-js&logoColor=white)](https://nodejs.org)
[![Fuse.js](https://img.shields.io/badge/Fuse.js-FFE000?style=for-the-badge&logo=javascript&logoColor=black)](https://fusejs.io)



---

## Overview

The **Smart Novel API** is a highly optimized serverless backend powering the **Smart Urdu Novel Bank**. It seamlessly handles a massive dataset of Urdu novels by combining the raw querying power of **PostgreSQL** with the fuzzy matching capabilities of **Fuse.js** — delivering an accurate, typo-tolerant search experience for every user.

---

##  Key Features

- **🧠 Dual-Layer Fuzzy Search** — Uses a Supabase RPC function (`search_novels_fuse`) to fetch tokenized candidates from the database, then pipes them through `Fuse.js` for strict, weighted threshold ranking *(Threshold: 0.4)*.

- **📊 Dynamic Pagination & Counting** — Automatically calculates the exact total number of novels in the database (`count: 'exact'`) in real-time, ensuring accurate pagination without any hardcoded numbers.

- **⚡ Serverless Architecture** — Hosted on **Vercel Serverless Functions** for zero maintenance, fast cold starts, and high scalability.

- **🌐 CORS Enabled** — Fully configured to accept cross-origin requests (`GET`, `OPTIONS`, `POST`) securely from the frontend client.

---

##  API Endpoints

Base URL: `https://your-deployment.vercel.app`

### 1. `GET /api/search` — Library Feed

Fetches a paginated chunk of **21 novels** and returns the live total count of the database.

**Query Parameters**

| Parameter | Type   | Required | Default | Description                        |
|-----------|--------|----------|---------|------------------------------------|
| `offset`  | Number | No       | `0`     | The starting index for pagination. |

**Example Request**

```
GET /api/search?offset=0
```

**Example Response**

```json
{
  "data": [
    {
      "Titles": "Ibtihal",
      "Links": "https://example.com/ibtihal-link"
    }
  ],
  "total": 123000
}
```

---

### 2. `GET /api/search?query=...` — Search Novels

Searches the database using a user query with typo tolerance and Roman Urdu support.

**Query Parameters**

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `query`   | String | Yes      | The search term (e.g., `Mushtaq Ahmad Yousufi`). |

**Example Request**

```
GET /api/search?query=Mushtaq+Ahmad+Yousufi
```

**Example Response**

```json
{
  "data": [
    {
      "Titles": "Zarguzasht by Mushtaq Ahmad Yousufi",
      "Links": "https://example.com/zarguzasht-link"
    }
  ],
  "total": 1
}
```

---

## 💻 Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A [Supabase](https://supabase.com/) project with the `urdu_novels` table and `search_novels_fuse` RPC function configured.
- [Vercel CLI](https://vercel.com/docs/cli) installed globally.

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/smart-novel-api.git
cd smart-novel-api
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_publishable_anon_key
```

**4. Start the development server**

```bash
vercel dev
```

Your API will be live at:

```
http://localhost:3000/api/search
```

---

## 🗂️ Project Structure

```
smart-novel-api/
├── api/
│   └── search.js        # Main serverless function
├── .env                 # Environment variables (not committed)
├── package.json
└── vercel.json          # Vercel deployment config
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Vercel](https://vercel.com) | Serverless hosting & deployment |
| [Supabase](https://supabase.com) | PostgreSQL database & RPC functions |
| [Fuse.js](https://fusejs.io) | Client-side fuzzy search & ranking |
| [Node.js](https://nodejs.org) | Runtime environment |

---

##  Author

Developed with ❤️ by **[TheUsmanDev](https://github.com/TheUsmanDev)**

*Building smart, fast, and scalable web experiences.*

---


# MapTrack AI

> Remember places smarter.

A full-stack personal map tracker with AI-assisted categorization and summarization. Built with React, FastAPI, SQLite, Leaflet, and OpenStreetMap.

---

## Features

- **Click-to-pin** — click anywhere on the map to save a location
- **My Location** — save your current GPS position instantly
- **Notes & categories** — attach a note and category to every place
- **AI categorize** — let AI suggest the right category from your title + note
- **AI summarize** — get a natural-language overview of your location habits
- **Edit & delete** — full CRUD on all saved places
- **AI fallback** — if OpenAI fails, Groq is tried automatically
- **Mobile-responsive** — works on phone and laptop

---

## Tech stack

| Layer    | Technology                             |
|----------|----------------------------------------|
| Frontend | React 18, Vite, react-leaflet, Leaflet |
| Backend  | FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Database | SQLite                                 |
| Map data | OpenStreetMap via CartoDB dark tiles   |
| AI       | OpenAI (primary) + Groq (fallback)     |

---

## Project structure

```
maptrack-ai/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── database.py          # SQLAlchemy engine + get_db() dependency
│   ├── models.py            # Place ORM model
│   ├── schemas.py           # Pydantic request/response shapes
│   ├── routers/
│   │   ├── places.py        # GET/POST/PUT/DELETE /places
│   │   └── ai.py            # POST /ai/categorize, /ai/summarize
│   ├── services/
│   │   └── ai_service.py    # Provider abstraction + fallback logic
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx           # Root state + orchestration
    │   ├── api/index.js      # All backend API calls
    │   ├── utils.js          # Helpers, category colors
    │   ├── styles/global.css
    │   └── components/
    │       ├── MapView.jsx   # Leaflet map, markers, click handler
    │       ├── Sidebar.jsx   # Tabbed panel wrapper
    │       ├── PlaceForm.jsx # Add/edit form with AI categorize
    │       ├── PlaceList.jsx # Saved places list + AI summary
    │       └── Toast.jsx     # Toast notification system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and/or GROQ_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at **http://localhost:8000** — interactive docs at **/docs**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**.

> The Vite dev server proxies `/places` and `/ai` to `localhost:8000`, so no CORS issues during development.

### 3. AI provider keys

| Provider | Where to get a key          | Notes             |
|----------|-----------------------------|-------------------|
| OpenAI   | platform.openai.com         | Primary provider  |
| Groq     | console.groq.com            | Free tier available — used as fallback |

You need at least one key. If neither is set, the AI endpoints will return a 503.

---

## API reference

### Places

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/places/`        | List all places          |
| POST   | `/places/`        | Create a place           |
| GET    | `/places/{id}`    | Get a single place       |
| PUT    | `/places/{id}`    | Update a place           |
| DELETE | `/places/{id}`    | Delete a place           |

Query params on GET /places/: `category=food` to filter.

### AI

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| POST   | `/ai/categorize`   | Suggest category from title + note |
| POST   | `/ai/summarize`    | Summarize saved places             |

---

## Design decisions

**SQLite for persistence** — no setup overhead for an MVP. A production version could swap in PostgreSQL by changing `DATABASE_URL`.

**AI provider abstraction** — `ai_service.py` defines a `PROVIDER_ORDER` list. Adding a third provider means adding one entry to that list. Each provider call is isolated so a failure in one doesn't affect others.

**Vite proxy** — avoids CORS configuration during development. In production, serve the frontend build from FastAPI's static files or a CDN.

**CartoDB dark tiles** — built on OpenStreetMap data. OSM attribution is included in the tile layer as required by the ODbL license.

**Partial updates** — `PUT /places/{id}` uses `exclude_unset=True` so only fields explicitly sent by the client are written. This prevents accidental overwrites.

---

## License

MIT

# MapTrack AI

**Intelligent location tracking and route planning for the web.**

Track the places you visit, let AI organize them, and discover patterns in your travels.

**Version:** 0.1.0 | **Status:** CS50 Final Project

---

## Demo

[**→ Video Demo**](#) *(link to video walkthrough)*

Or see a quick screenshot:

![MapTrack AI Interface](#) *(add screenshot of main app)*

---

## About

**MapTrack AI** is a full-stack web application that lets you save, track, and analyze places you visit on an interactive map. When you click on a location, you create a place marker with a title, note, and category. An AI assistant helps automatically categorize your places, calculates distances between them, and generates insights about your tracking habits.

Built with modern web technologies (React 18 + FastAPI), the app demonstrates full-stack architecture, REST API design, real-world integrations (geolocation, mapping, routing, LLMs), and thoughtful UI/UX.

---

## Features

### Core Features

- **Interactive Map** — Click anywhere to create a place. Uses Leaflet with OpenStreetMap tiles.
- **Place Tracking** — Save places with title, note, category, coordinates, and timestamps.
- **AI Categorization** — Automatic place categorization suggestions using OpenAI, Gemini, or Groq (with provider fallback).
- **AI Summarization** — Generate a natural-language overview of all your saved places and their patterns.
- **Distance Analysis** — Calculate distances between places using Haversine formula. View sorted list from your current location or full N×N distance matrix.
- **Route Builder** — Create routes by combining saved places and your current location. Uses OSRM (Open Source Routing Machine) for turn-by-turn navigation.
- **Named Routes** — Save routes with custom colors and toggle visibility on the map.
- **PDF Export** — Export all your places and distance data as a styled PDF.
- **Map Style Switcher** — Toggle between 4 map styles: Dark (CartoDB), Light (CartoDB), Street (OpenStreetMap), Topographic (OpenTopoMap).
- **Responsive Sidebar** — Organize all features into tabs: Add Place, Places List, Routes, Distance Matrix, Map Settings.

### Design

- **Obsidian Glass Theme** — Dark mode with glassmorphism design system. Consistent colour palette, spacing, and typography.
- **Accessibility** — ARIA labels, semantic HTML, keyboard-navigable UI.

---

## Why I Built This

I wanted to explore building a real full-stack application from scratch while practicing:

1. **React 18 + Hooks** — State management, component lifecycle, custom hooks
2. **FastAPI** — Building a clean, documented REST API with Pydantic validation
3. **AI Integration** — Working with LLM APIs in production (fallback strategies, error handling, cost optimization)
4. **Real-world APIs** — Integrating external services: geolocation, Nominatim geocoding, OSRM routing
5. **Database Design** — SQLAlchemy ORM, timestamps, schema relationships
6. **Design Systems** — Building a cohesive, accessible UI at scale

The problem it solves is real: I wanted a way to remember places I've visited, see patterns in my travels, and plan routes efficiently — without relying on a closed-source service.

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 18 App (Vite)                                      │   │
│  │  ├─ App.jsx (state management, data orchestration)       │   │
│  │  ├─ MapView (Leaflet integration)                        │   │
│  │  ├─ Sidebar (5 tabs: Add, List, Routes, Dist, Settings) │   │
│  │  ├─ PlaceForm (create/edit places + AI suggestions)      │   │
│  │  └─ RouteBuilder (OSRM integration)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /places     → Create, read, update, delete locations    │   │
│  │  /routes     → Save and manage routes                    │   │
│  │  /ai         → Categorization & summarization endpoints  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services Layer                                           │   │
│  │  ├─ ai_service.py (multi-provider LLM fallback)          │   │
│  │  └─ routes logic (OSRM data processing)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌─────────────────────────────────────────────────────────────────┐
│                    SQLite Database                               │
│  ├─ places (id, title, note, category, lat, lng, timestamps)   │
│  └─ routes (id, name, distance, duration, geometry, color)     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Example: Creating a Place

1. **User clicks map** → `MapView` captures click coordinates
2. **Form opens** → `PlaceForm` renders with coordinates and empty fields
3. **User enters title + note** → Form state updates in React
4. **User clicks "AI suggest"** → Frontend calls `POST /ai/categorize`
5. **Backend calls AI provider** → Multi-provider fallback tries OpenAI → Gemini → Groq
6. **AI returns suggestion** → Frontend shows confidence and provider
7. **User clicks "Save place"** → `POST /places/` with data
8. **Backend validates + saves** → SQLAlchemy commits to SQLite
9. **Response returns** → Frontend updates places list, map re-renders

---

## Tech Stack

### Frontend
- **React 18** — UI framework, hooks for state management
- **Vite** — Build tool, dev server with HMR, proxy for API
- **Leaflet 1.9.4** — Interactive map library
- **react-leaflet** — React wrapper for Leaflet
- **Axios** — HTTP client for API calls
- **jsPDF + jspdf-autotable** — PDF generation and styling
- **CSS** — Custom Obsidian Glass design system (no CSS framework)

### Backend
- **FastAPI** — Async Python web framework
- **Uvicorn** — ASGI server
- **SQLAlchemy 2.0** — ORM for database abstraction
- **Pydantic** — Data validation and serialization
- **httpx** — Async HTTP client for external APIs
- **python-dotenv** — Environment variable management

### Database
- **SQLite** — Lightweight, serverless, file-based SQL database

### External APIs
- **OpenAI API** — GPT-4o-mini for place categorization & summarization
- **Google Gemini API** — Fallback LLM provider
- **Groq API** — Secondary fallback (free tier available)
- **OSRM (Open Source Routing Machine)** — Free, open-source routing engine
- **Leaflet/OpenStreetMap** — Map tiles and geolocation
- **Nominatim** — Reverse geocoding (via OpenStreetMap)

---

## Project Structure

### Frontend

```
frontend/
├── index.html              # HTML entry point
├── package.json            # Dependencies (React, Leaflet, jsPDF, Axios)
├── vite.config.js          # Vite config (HMR, proxy to backend)
├── src/
│   ├── App.jsx            # Root component, state management, data orchestration
│   ├── main.jsx           # React entry point
│   ├── utils.js           # Utilities (Haversine, formatting, category colors)
│   ├── api/
│   │   └── index.js       # API client (axios wrapper for /places, /routes, /ai)
│   ├── styles/
│   │   └── global.css     # Obsidian Glass design system
│   ├── components/
│   │   ├── MapView.jsx         # Leaflet map container, click handlers
│   │   ├── Sidebar.jsx         # Tab navigation + tab switching
│   │   ├── PlaceForm.jsx       # Create/edit place form + AI suggestions
│   │   ├── PlaceList.jsx       # List saved places with filters
│   │   ├── DistancePanel.jsx   # Distance from location + NxN matrix
│   │   ├── RoutesPanel.jsx     # Route builder + saved routes UI
│   │   ├── MapSearchBar.jsx    # Search bar for geocoding
│   │   ├── RouteLayer.jsx      # Route visualization on map
│   │   ├── SettingsPanel.jsx   # Map style switcher + about info
│   │   └── Toast.jsx           # Toast notifications
│   └── services/
│       └── pdfExport.js        # PDF generation with jsPDF
```

### Backend

```
backend/
├── main.py                 # FastAPI app initialization, routers, CORS
├── database.py             # SQLAlchemy engine, session, Base class
├── models.py               # ORM models (Place, Route)
├── schemas.py              # Pydantic validation schemas
├── routers/
│   ├── places.py          # GET/POST/PUT/DELETE places endpoints
│   ├── routes.py          # GET/POST/DELETE routes endpoints
│   └── ai.py              # POST /categorize, POST /summarize endpoints
├── services/
│   └── ai_service.py      # LLM provider abstraction (OpenAI, Gemini, Groq fallback)
└── requirements.txt        # Python dependencies
```

---

## Key Components & Files

### Frontend

**`App.jsx`** — The root component and data orchestrator.
- Manages state for places, routes, pending place, user location, sidebar visibility
- Handles CRUD operations: create, update, delete places
- Orchestrates map interactions (click-to-save, fly-to)
- Manages sidebar panel state
- Coordinates data flow between Map and Sidebar

**`api/index.js`** — API client layer.
- Axios instance with automatic baseURL handling
- Functions: `getPlaces()`, `createPlace()`, `updatePlace()`, `deletePlace()`
- Route functions: `getRoutes()`, `createRoute()`, `deleteRoute()`
- AI functions: `aiCategorize()`, `aiSummarize()`
- Routing: `fetchOSRMRoute()` (external OSRM call)

**`MapView.jsx`** — Leaflet integration.
- Renders map with tiles, markers, popups
- Handles map click events (creates pending places)
- Renders place markers with category-specific colors
- Shows distance circles from user location
- Integrates RouteLayer for route visualization
- Supports 4 tile layer styles

**`PlaceForm.jsx`** — Create/edit form.
- Real-time form state management
- AI categorization button (calls `/ai/categorize`)
- Saves to `/places/` on submit
- Shows AI provider and confidence level
- Form validation feedback

**`DistancePanel.jsx`** — Distance calculations.
- Sorted list from user location
- Full N×N distance matrix with colour-coded cells
- Uses Haversine formula for calculations
- Matrix interactivity and hover states

**`RoutesPanel.jsx`** — Route builder.
- Waypoint management (add, reorder, remove)
- Route calculation via OSRM API
- Route save form (name, colour)
- Saved routes list with toggle visibility
- Delete route with error handling

**`services/pdfExport.js`** — PDF generation.
- Uses jsPDF and jspdf-autotable
- Exports places list, distance matrix, metadata
- Custom header and styling
- Includes user location (if available)

**`styles/global.css`** — Obsidian Glass design system.
- CSS variables for colours, spacing, shadows
- Typography (DM Sans, DM Mono)
- Component styles (buttons, forms, cards, panels)
- Responsive design

### Backend

**`main.py`** — FastAPI application initialization.
- CORS middleware (allows Vite dev server)
- Registers routers (places, routes, ai)
- Database initialization
- Health check endpoint

**`models.py`** — SQLAlchemy ORM models.
- `Place` — id, title, note, category, lat, lng, created_at, updated_at
- `Route` — id, name, distance, duration, color, waypoints (JSON), geometry (JSON), created_at
- Uses mapped_column for type hints

**`schemas.py`** — Pydantic validation schemas.
- `PlaceCreate`, `PlaceUpdate`, `PlaceOut` — place validation
- `RouteCreate`, `RouteOut` — route validation
- `CategorizeRequest`, `CategorizeResponse` — AI categorization
- `SummarizeRequest`, `SummarizeResponse` — AI summarization
- All schemas validate data types and bounds (lat ∈ [-90, 90], lng ∈ [-180, 180])

**`routers/places.py`** — Place CRUD endpoints.
- `GET /places/` — List places (with optional category filter)
- `POST /places/` — Create place
- `GET /places/{id}` — Get single place
- `PUT /places/{id}` — Update place (partial updates supported)
- `DELETE /places/{id}` — Delete place

**`routers/routes.py`** — Route CRUD endpoints.
- `GET /routes/` — List saved routes
- `POST /routes/` — Save new route
- `DELETE /routes/{id}` — Delete route
- Geometry stored as JSON array of `[lat, lng]` pairs

**`routers/ai.py`** — AI integration endpoints.
- `POST /ai/categorize` — Suggest category for a place
  - Input: title, optional note
  - Output: suggested category, provider name, confidence level
- `POST /ai/summarize` — Generate summary of saved places
  - Input: optional place_ids, max_places
  - Output: summary text, provider, place count

**`services/ai_service.py`** — Multi-provider LLM abstraction.
- Supports OpenAI (gpt-4o-mini), Gemini (gemini-2.0-flash), Groq (llama-3.1-8b)
- Fallback strategy: tries providers in order, skips missing API keys
- Returns provider name with each response (transparency)
- Error handling and logging
- Temperature set to 0.2 for deterministic categorization

**`database.py`** — Database configuration.
- SQLAlchemy engine (SQLite with proper threading config)
- Session factory
- Dependency injection for FastAPI (`get_db()`)

---

## Design Decisions & Tradeoffs

### 1. React + FastAPI

**Why?** React is the industry standard for interactive UIs; FastAPI is modern, fast, and great for APIs. Together they're a strong full-stack pair that's also great for learning.

**Tradeoff:** Added complexity vs. a monolithic framework like Django. But the separation of concerns is cleaner.

### 2. Route Geometry Format: `[lat, lng]` Instead of GeoJSON

**Why?** I store routes as JSON stringified `[lat, lng]` pairs instead of GeoJSON's `[lng, lat]` format.

**Reason:** Leaflet (the map library) uses `[lat, lng]` in its API (`L.latLng`). Keeping the same convention avoids coordinate confusion and makes debugging easier.

**Tradeoff:** Non-standard for geospatial data. But for CS50 scope, simplicity wins.

### 3. Multi-Provider AI Fallback

**Why?** I support OpenAI, Gemini, and Groq with automatic fallback instead of hardcoding one provider.

**Reasons:**
- Resilience — if one provider is down, the app keeps working
- Accessibility — students can use any API key they have (free tier or paid)
- Real-world practice — shows production-grade thinking

**Tradeoff:** More code to maintain. But the abstraction is clean.

### 4. Haversine Over Vincenty

**Why?** I use the Haversine formula for distance calculations instead of Vincenty's geodetic formula.

**Reason:** Haversine is accurate to ~100km, simpler, and sufficient for user-facing distance estimates. Vincenty is overkill for this use case.

**Tradeoff:** Less geodetic accuracy. But practically irrelevant for distances under 1,000 km.

### 5. SQLite (Not PostgreSQL)

**Why?** SQLite for the MVP, no external database server needed.

**Reason:** Simpler to deploy, develop, and demo. Easy to swap for PostgreSQL later (same SQLAlchemy ORM).

**Tradeoff:** SQLite has limits (no concurrent writes). Fine for a single user. Would switch to PostgreSQL for production.

### 6. Obsidian Glass Design System

**Why?** No CSS framework. Custom CSS variables and components.

**Reasons:**
- Learning — I wanted to understand CSS-in-the-large
- Branding — Cohesive dark theme that feels intentional
- Performance — No CSS framework overhead

**Tradeoff:** More CSS code to write. But the result is polished and unique.

### 7. Vite Over Create React App

**Why?** Vite for faster dev server and better build performance.

**Reason:** Vite is significantly faster than CRA, and it's now the standard in the React ecosystem.

**Tradeoff:** Slightly less official tooling. But it's from Evan You (Vue creator) and very reliable.

---

## Challenges & Solutions

### 1. Leaflet Icon Paths Breaking in Vite

**Problem:** Leaflet's default marker icons rely on relative paths that break when bundled by Vite.

**Solution:** Manually set icon URLs to unpkg CDN URLs (lines 5–15 of MapView.jsx):
```javascript
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
```

### 2. Coordinate System Confusion

**Problem:** GeoJSON uses `[lng, lat]`, but Leaflet and our database use `[lat, lng]`. Mixing these up breaks routing and map positioning.

**Solution:** Strict convention throughout the app:
- Database stores `(lat, lng)` as separate columns
- Routes store geometry as JSON of `[lat, lng]` pairs
- OSRM returns `[lng, lat]`, so we reverse it before storing (see RoutesPanel.jsx line 30)
- Documentation added to models.py and routes.py

### 3. OSRM Integration

**Problem:** OSRM is external, async, and can be slow or fail.

**Solution:**
- Made the API call explicit in the frontend (api/index.js `fetchOSRMRoute`)
- Frontend handles errors gracefully (toast notification)
- User can see distance/duration estimates before saving

### 4. Multi-Provider LLM Fallback

**Problem:** What if OpenAI is down? User can't categorize places.

**Solution:** Built a provider fallback system in ai_service.py:
1. Try OpenAI
2. If no key or fails, try Gemini
3. If no key or fails, try Groq
4. If all fail, return 503 error with reason

The service logs which provider was used, so debugging is transparent.

### 5. Real-time Updates Without WebSockets

**Problem:** When a user saves a place, the UI should update immediately.

**Solution:** Optimistic updates in React:
- Save to database
- Immediately add to local state (setState)
- If save fails, revert (catch block)
- No need for WebSockets for single-user app

---

## Future Improvements

### Short Term
- **Route editing** — Currently you can only delete routes. Add ability to modify waypoints.
- **Place editing from map** — Click a place marker to edit inline.
- **Bulk operations** — Delete multiple places at once, bulk categorize.
- **Search/filter by coordinates** — Search by bounding box or radius.

### Medium Term
- **Place sharing** — Share a place or collection via link.
- **Collaborative tracking** — Multiple users tracking places together.
- **Time-based filters** — Filter places by date range.
- **Place photos** — Upload and display photos for each place.
- **Custom categories** — Let users define custom categories beyond the preset list.

### Long Term
- **Mobile app** — React Native or native iOS/Android apps.
- **Production deployment** — Docker, Kubernetes, cloud deployment (AWS/GCP).
- **Database migrations** — Alembic for schema versioning.
- **Analytics** — Understand user behavior, heatmaps, travel patterns.
- **API rate limiting** — Prepare for multiple users.
- **Caching** — Redis for session management, distance matrix caching.

---

## Setup & Running Locally

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **Git** (to clone the repository)
- API keys (at least one of):
  - OpenAI API key (recommended) — [Get here](https://platform.openai.com/api-keys)
  - Google Gemini API key — [Get here](https://aistudio.google.com/)
  - Groq API key (free tier available) — [Get here](https://console.groq.com/)

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/chaheth/MapTrackerAI2.git
cd MapTrackerAI2
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
```

#### 3. Backend Setup
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

#### Create `.env` file in `backend/` directory:

```bash
# Choose at least ONE of these:
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
GROQ_API_KEY=...

# Optional:
FRONTEND_ORIGIN=http://localhost:5173  # Default is set in code
DATABASE_URL=sqlite:///./maptrack.db    # Default is set in code
```

### Running Locally

#### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate  # Activate venv
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`
API docs available at `http://localhost:8000/docs`

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

**That's it!** Open `http://localhost:5173` in your browser.

### How to Use

1. **Click on the map** to create a place
2. **Enter title, note, category** (AI can suggest category)
3. **Click "Save place"** — appears on map and in Places list
4. **Calculate distances** — go to Distance tab to see all distances
5. **Build routes** — go to Routes tab, add waypoints, save route
6. **Export PDF** — click export button in Distance panel
7. **Change map style** — go to Map Settings tab

---

## API Documentation

Full API documentation available at `http://localhost:8000/docs` (Swagger UI).

### Key Endpoints

**Places**
- `GET /places/` — List all places
- `GET /places/?category=food` — Filter by category
- `POST /places/` — Create place
- `PUT /places/{id}` — Update place
- `DELETE /places/{id}` — Delete place

**Routes**
- `GET /routes/` — List all saved routes
- `POST /routes/` — Save new route
- `DELETE /routes/{id}` — Delete route

**AI**
- `POST /ai/categorize` — Suggest category for place
- `POST /ai/summarize` — Generate summary of all places

**Health**
- `GET /health` — Health check

---

## Deployment

Currently deployed for local development only. Production deployment requires:

- Environment variables (.env file with API keys)
- Database migration strategy (Alembic)
- Static file serving (Vite build + reverse proxy)
- Error logging and monitoring
- Rate limiting and CORS configuration
- HTTPS/SSL certificates

This is beyond the scope of CS50, but the code is structured to make it straightforward.

---

## Testing

No automated tests currently. Manual testing checklist:

- [ ] Create 5+ places across different categories
- [ ] Edit a place, verify update
- [ ] Delete a place, verify removal
- [ ] Test AI categorization with various titles
- [ ] Build route with 3+ waypoints
- [ ] Toggle route visibility
- [ ] Delete route with error (kill backend briefly, verify error message)
- [ ] Export PDF with 10+ places
- [ ] Switch between 4 map styles
- [ ] Test on mobile browser (responsive design)

---

## Credits & Attribution

- **Leaflet** — Interactive map library
- **OpenStreetMap** — Free map tiles and geocoding
- **OSRM** — Open Source Routing Machine
- **OpenAI, Google Gemini, Groq** — AI providers
- **jsPDF** — PDF generation
- **FastAPI & SQLAlchemy** — Backend framework & ORM
- **React & Vite** — Frontend framework & build tool

---

## License

This project is submitted as a CS50 final project. Code is available for educational purposes.

---

## Questions?

- **For CS50:** See design decisions in this README and inline comments in code
- **General questions:** Check the code comments and FastAPI docs (`/docs`)

---

**Built with curiosity and code. — Chaheth Senevirathne, May 2026**

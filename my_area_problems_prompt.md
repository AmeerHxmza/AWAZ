# My Area Problems — Full Stack Implementation Prompt

## Project Overview

Build a full-stack civic complaint management platform called **"My Area Problems"** targeting SDG 6 (Clean Water) and SDG 11 (Sustainable Cities). The platform allows Pakistani residents (primarily in Islamabad) to report local civic issues (sewage leaks, potholes, garbage, water shortages) via text or Urdu voice input. The system uses Agentic AI with RAG (Retrieval-Augmented Generation) to auto-draft formal complaint letters, route them to the correct authority (WASA, CDA, LG offices), and track their resolution status. A live GPS-based heatmap visualizes complaint density across the city.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Database | SQLite (via SQLAlchemy ORM) |
| AI Agents | LangChain multi-agent pipeline |
| Vector Store | ChromaDB (for RAG document retrieval) |
| STT | OpenAI Whisper (Urdu voice → text) |
| Geo/Heatmap | scikit-learn (GPS clustering) + Folium (heatmap HTML) |
| Email/SMS | SMTP + Twilio |
| Frontend | Next.js 14 (App Router) |
| Auth | JWT-based Role-Based Access Control (RBAC) |

---

## Part 1: Backend — FastAPI + SQLite

### 1.1 Project Structure

```
backend/
├── main.py                  # FastAPI app entry point
├── database.py              # SQLAlchemy engine + session
├── models.py                # ORM models
├── schemas.py               # Pydantic schemas
├── auth/
│   ├── jwt_handler.py       # JWT creation & verification
│   ├── dependencies.py      # get_current_user, require_admin
│   └── router.py            # /auth/register, /auth/login, /auth/create-admin
├── routers/
│   ├── complaints.py        # CRUD for complaints
│   ├── heatmap.py           # Folium heatmap generation endpoint
│   └── admin.py             # Admin-only management endpoints
├── agents/
│   ├── pipeline.py          # Master agent orchestrator
│   ├── agent1_intake.py     # Intake + classification agent
│   ├── agent2_rag.py        # RAG retrieval agent
│   ├── agent3_drafter.py    # Complaint letter drafter
│   ├── agent4_geo.py        # GPS clustering agent
│   ├── agent5_router.py     # Authority routing + notification
│   └── agent6_tracker.py   # Status tracking + escalation
├── rag/
│   ├── embed_documents.py   # One-time ChromaDB embedding script
│   └── retriever.py         # ChromaDB retrieval helper
├── utils/
│   ├── whisper_stt.py       # Whisper STT integration
│   └── notifications.py     # SMTP + Twilio wrappers
├── data/
│   └── documents/           # WASA, CDA, RTI Act PDFs/text files
├── requirements.txt
└── .env
```

---

### 1.2 Database Schema (SQLite via SQLAlchemy)

#### Table: `users`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | Auto-increment |
| full_name | String | Required |
| email | String | Unique, required |
| hashed_password | String | bcrypt hashed |
| role | Enum('user','admin') | Default: `user` |
| is_active | Boolean | Default: `True` |
| created_at | DateTime | Auto UTC |

#### Table: `complaints`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | Auto-increment |
| user_id | Integer FK → users.id | Required |
| title | String | Short description |
| description | Text | Full complaint text (can be Whisper transcript) |
| category | Enum('water','road','garbage','sewage','other') | Set by Agent 1 |
| status | Enum('pending','submitted','acknowledged','resolved','escalated') | Default: `pending` |
| authority | String | e.g. "WASA Islamabad", "CDA" — set by Agent 5 |
| authority_email | String | Routing target |
| drafted_letter | Text | Output from Agent 3 |
| latitude | Float | GPS coordinate |
| longitude | Float | GPS coordinate |
| photo_url | String | Uploaded photo path |
| is_voice_input | Boolean | True if submitted via Whisper |
| created_at | DateTime | Auto UTC |
| updated_at | DateTime | Auto-updates |

#### Table: `notifications`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| complaint_id | Integer FK → complaints.id | |
| channel | Enum('email','sms') | |
| recipient | String | Email or phone |
| status | Enum('sent','failed') | |
| sent_at | DateTime | |

---

### 1.3 Authentication & RBAC

**Registration Flow:**
- `POST /auth/register` — Open endpoint. Any user who registers is automatically assigned `role = "user"`. No admin can be created through this endpoint.
- `POST /auth/login` — Returns a signed JWT containing `user_id`, `email`, `role`, and `exp`.
- `POST /auth/create-admin` — **Protected by a secret API key passed in the request header** (`X-Admin-Secret`). This is the ONLY way to create an admin account. Used exclusively during development/testing via tools like Postman or curl. The secret key is stored in `.env`.

**JWT Dependency:**
- `get_current_user` — Decodes JWT, returns user object. Used on all authenticated routes.
- `require_admin` — Extends `get_current_user`. Raises `403 Forbidden` if `role != "admin"`.

**Example `.env`:**
```
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_SECRET=your_super_secret_admin_creation_key
OPENAI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

---

### 1.4 API Endpoints

#### Auth Routes (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user (role = user) |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/create-admin` | X-Admin-Secret header | Create admin account (testing only) |
| GET | `/auth/me` | JWT | Get current user profile |

#### Complaint Routes (`/complaints`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/complaints/` | JWT (user/admin) | Submit new complaint (text or voice) |
| GET | `/complaints/` | JWT (user) | Get own complaints |
| GET | `/complaints/{id}` | JWT (user/admin) | Get single complaint |
| PUT | `/complaints/{id}/status` | JWT (admin) | Update complaint status |
| DELETE | `/complaints/{id}` | JWT (admin) | Delete complaint |
| GET | `/complaints/all` | JWT (admin) | Get all complaints (with filters) |

#### Voice/STT Route
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/stt/transcribe` | JWT | Upload audio file → Whisper → returns Urdu/English transcript |

#### Heatmap Route
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/heatmap/` | Public | Returns Folium heatmap HTML of all complaints |

#### Admin Routes (`/admin`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/users` | JWT (admin) | List all users |
| PUT | `/admin/users/{id}/deactivate` | JWT (admin) | Deactivate a user |
| GET | `/admin/stats` | JWT (admin) | Dashboard stats (complaints by category, status) |

---

### 1.5 Agentic AI Pipeline

When a complaint is submitted, the following multi-agent pipeline runs sequentially:

**Agent 1 — Intake & Classification**
- Input: Raw text or Whisper transcript
- Task: Classify complaint into category (water/road/garbage/sewage/other), extract key issue keywords, detect language (Urdu/English)
- Output: `{category, keywords, language, summary}`

**Agent 2 — RAG Retrieval**
- Input: Category + keywords from Agent 1
- Task: Query ChromaDB for relevant chunks from WASA, CDA, RTI Act 2017 documents
- Output: Top 3–5 relevant document excerpts with source metadata

**Agent 3 — Complaint Letter Drafter**
- Input: Original complaint + Agent 2 RAG context
- Task: Draft a formal, legally-informed complaint letter in both Urdu and English. Reference specific clauses from retrieved RTI/WASA documents.
- Output: `{letter_english, letter_urdu}`

**Agent 4 — GPS Clustering (Geo Agent)**
- Input: GPS coordinates of current + historical complaints
- Task: Use scikit-learn DBSCAN to find complaint hotspots. Generate Folium heatmap HTML.
- Output: Heatmap HTML file saved to `/static/heatmap.html`, cluster metadata

**Agent 5 — Authority Router & Notifier**
- Input: Category, location, drafted letter
- Task: Lookup correct authority (WASA for water/sewage, CDA for roads, LG for garbage). Send complaint letter via SMTP email + Twilio SMS to authority contact.
- Output: `{authority, authority_email, notification_status}`

**Agent 6 — Status Tracker & Escalation**
- Input: Complaint ID, current status, created_at timestamp
- Task: Background scheduled job (APScheduler). If status remains `submitted` for 72 hours → escalate to senior authority. Send user update via email/SMS.
- Output: Status updated in DB, escalation notification sent

---

### 1.6 Whisper STT Integration

- Endpoint: `POST /stt/transcribe`
- Accepts: `.wav`, `.mp3`, `.ogg`, `.m4a` audio file upload
- Process: Save file temporarily → pass to `whisper.load_model("base")` → transcribe → return text
- Supports Urdu language detection automatically (Whisper is multilingual)
- Returned transcript is passed directly into the complaint submission flow

---

### 1.7 RAG Setup (ChromaDB)

- Run `embed_documents.py` once to embed all documents in `/data/documents/` into ChromaDB
- Documents include: WASA Islamabad regulations, CDA bylaws, RTI Act 2017, sample complaint templates
- Embedding model: `text-embedding-ada-002` (OpenAI) or `sentence-transformers/all-MiniLM-L6-v2` (local fallback)
- Retriever returns top-k chunks with metadata (source document, page number)

---

## Part 2: Frontend — Next.js 14 (App Router)

### 2.1 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with font + metadata
│   ├── page.tsx                # Landing/home page
│   ├── (auth)/
│   │   ├── login/page.tsx      # Login page
│   │   └── register/page.tsx   # Register page
│   ├── dashboard/
│   │   ├── page.tsx            # User dashboard (own complaints)
│   │   └── layout.tsx          # Dashboard layout (sidebar + nav)
│   ├── submit/
│   │   └── page.tsx            # Complaint submission form (text + voice)
│   ├── status/
│   │   └── [id]/page.tsx       # Single complaint status tracker
│   ├── heatmap/
│   │   └── page.tsx            # Embedded Folium heatmap (WebView/iframe)
│   └── admin/
│       ├── layout.tsx           # Admin layout (admin sidebar)
│       ├── page.tsx             # Admin dashboard (stats)
│       ├── complaints/page.tsx  # All complaints management
│       └── users/page.tsx       # User management
├── components/
│   ├── ui/                     # Reusable UI (Button, Input, Card, Badge, Modal)
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── ComplaintCard.tsx
│   ├── VoiceRecorder.tsx       # Mic button → uploads audio → shows transcript
│   ├── StatusBadge.tsx         # Color-coded complaint status
│   ├── HeatmapEmbed.tsx        # iframe wrapper for Folium HTML
│   └── ProtectedRoute.tsx      # HOC for route protection
├── lib/
│   ├── api.ts                  # Axios instance with JWT interceptor
│   ├── auth.ts                 # Auth helpers (store/get/clear token)
│   └── types.ts                # TypeScript types matching backend schemas
├── context/
│   └── AuthContext.tsx          # Global auth state (user, role, login, logout)
├── middleware.ts               # Next.js middleware for route protection
└── .env.local
```

---

### 2.2 Role-Based Access Control (Frontend)

**How it works:**

1. On `POST /auth/register`, backend always assigns `role = "user"` — no UI option for role selection.
2. On login, backend returns JWT containing `role` claim.
3. Frontend decodes JWT (client-side, no verification needed — just reading the payload) and stores `{ user, role, token }` in `AuthContext`.
4. `middleware.ts` reads the JWT from cookies and:
   - Redirects unauthenticated users from `/dashboard`, `/submit`, `/status/*`, `/admin/*` → `/login`
   - Redirects `role = "user"` from `/admin/*` → `/dashboard` (403 page)
   - Admin users can access all routes

**Role-based UI differences:**

| Feature | `user` role | `admin` role |
|---|---|---|
| Submit complaint | ✅ | ✅ |
| View own complaints | ✅ | ✅ |
| View ALL complaints | ❌ | ✅ |
| Update complaint status | ❌ | ✅ |
| Delete complaints | ❌ | ✅ |
| View admin dashboard | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| View heatmap | ✅ (public) | ✅ |

---

### 2.3 Key Pages & Features

#### Landing Page (`/`)
- Hero section: Project name, tagline, SDG badges (SDG 6 + SDG 11)
- CTA buttons: "Report an Issue" → `/register` and "View Heatmap" → `/heatmap`
- Stats section: Total complaints submitted, resolved, authorities notified

#### Login Page (`/login`)
- Email + password form
- On success: store JWT in httpOnly cookie + memory, redirect to `/dashboard`
- Show error for invalid credentials

#### Register Page (`/register`)
- Full name, email, password, confirm password
- No role selection (always registers as `user`)
- On success: auto-login + redirect to `/dashboard`

#### Complaint Submission (`/submit`)
- Two input modes toggled by tab: **Text** | **Voice**
- Text mode: Title, category dropdown, description textarea, photo upload, GPS auto-detect (browser geolocation API)
- Voice mode: `VoiceRecorder` component — press mic → record audio → auto-upload to `/stt/transcribe` → shows editable transcript → submit
- On submit: calls `POST /complaints/`, shows processing state while agents run, redirects to `/status/{id}` when done

#### Status Tracker (`/status/[id]`)
- Shows complaint details, current status with timeline stepper
- Displays drafted letter (collapsible)
- Shows authority it was routed to + notification status

#### Heatmap Page (`/heatmap`)
- Full-page `<iframe src="http://backend:8000/heatmap/" />` embedding the Folium HTML
- Filter controls above iframe: filter by category, date range (sends query params to heatmap endpoint)

#### Admin Dashboard (`/admin`)
- Stats cards: Total complaints, pending, resolved, escalated
- Bar chart: Complaints by category
- Line chart: Complaints over time
- Recent complaints table with quick status update

---

### 2.4 API Integration Layer (`lib/api.ts`)

```typescript
// Axios instance — auto-attaches JWT from cookie/memory to every request
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  const token = getToken(); // from cookie or localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) logout(); // clear token, redirect to login
    return Promise.reject(err);
  }
);
```

---

## Part 3: Testing the Admin Endpoint

Since the frontend has no admin registration UI, admin accounts are created directly via the API using a tool like **Postman** or **curl** during development.

**Request:**
```bash
curl -X POST http://localhost:8000/auth/create-admin \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_super_secret_admin_creation_key" \
  -d '{
    "full_name": "Admin User",
    "email": "admin@myareaproblems.pk",
    "password": "StrongPassword123"
  }'
```

**Response:**
```json
{
  "id": 1,
  "full_name": "Admin User",
  "email": "admin@myareaproblems.pk",
  "role": "admin",
  "is_active": true
}
```

---

## Part 4: Environment & Setup Instructions

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python rag/embed_documents.py   # One-time: embed documents into ChromaDB
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev  # runs on http://localhost:3000
```

---

## Part 5: Key Constraints & Notes

1. **SQLite** — Use SQLite for the hackathon. The ORM (SQLAlchemy) abstracts the DB, so migrating to PostgreSQL later requires only a connection string change.
2. **No admin via UI** — The frontend deliberately has no admin creation flow. Admin accounts exist only in the DB, created via the protected API endpoint.
3. **Agent pipeline is async** — After complaint submission, agents run in a background task (`FastAPI BackgroundTasks`) so the user gets an immediate response with the complaint ID, not waiting for the full pipeline.
4. **Whisper model** — Use `whisper.load_model("base")` for speed on low-resource hardware. Switch to `"small"` or `"medium"` for better Urdu accuracy if resources allow.
5. **ChromaDB is local** — Stored in `/backend/chroma_db/`. No external vector DB service needed.
6. **Folium heatmap** — Generated on-demand (or cached) as a self-contained HTML file served as a static file or returned as an HTML response from FastAPI.
7. **JWT stored in cookies** — Use `httpOnly` cookies for security in production, fallback to `localStorage` for dev simplicity.

---

## Deliverable Summary

Build this platform end-to-end with:
- ✅ FastAPI backend with SQLite, full CRUD, JWT RBAC
- ✅ 6-agent LangChain pipeline (intake → RAG → draft → geo → route → track)
- ✅ Whisper Urdu STT integration
- ✅ ChromaDB RAG with WASA/CDA/RTI documents
- ✅ Folium GPS heatmap
- ✅ Next.js 14 frontend with role-based routing and UI
- ✅ Admin creation via API only (no UI), user self-registration always as `role=user`
- ✅ SMTP + Twilio complaint routing to authorities

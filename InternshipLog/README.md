# 🎓 InternshipLog

A personal, production-ready internship application tracker designed specifically for students to organize job submissions, track interview pipelines, manage follow-up deadlines, and visualize stage distributions.

Built with **React (Vite)** on the frontend and **Node.js + Express + MongoDB (Mongoose)** on the backend.

---

## 📌 Features

- **End-to-End Application Tracking (CRUD)**:
  - Track `company`, `role`, `stage`, `deadline`, `appliedDate`, `followUpDate`, `followUpNote`, `location`, `link`, and `notes`.
  - Stages: `Wishlist`, `Applied`, `OA/Screening`, `Interview`, `Offer`, `Rejected`.
- **Interactive Dashboard**:
  - Summary metric cards with stage-coded colors.
  - Plain CSS/SVG **stage distribution bar chart** showing pipeline proportions and progress per stage.
  - Upcoming follow-up reminders (next 7 days) with priority **overdue highlighting in red**.
  - One-click **"Mark done"** action to complete follow-ups.
- **Dual View Layout (Table & Kanban Board)**:
  - **Table View**: Responsive table on desktop that automatically transitions to card layout on mobile (`< 768px`).
  - **Kanban Board**: 6-column pipeline view with one-click `←` and `→` stage advance buttons.
- **Instant Search & Filtering**:
  - Debounced real-time search across company, role, location, and notes.
  - Filter tabs by stage with dynamic count badges.
  - Per-row quick stage-change dropdown for fast pipeline progression.
- **Security & Reliability**:
  - Input validation mirroring client and server (`express-validator`).
  - Centralized error handling (Mongoose validation, CastError, duplicate keys).
  - Rate limiting via `express-rate-limit` (100 reqs / 15 mins).
  - Security headers via `helmet` and CORS isolation.
  - Keyboard-accessible dialogs (supports <kbd>Esc</kbd> key dismiss).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, React Router DOM 7, Axios, React Hot Toast |
| **Styling** | Mobile-first Plain CSS with CSS Variables (No heavy external UI framework) |
| **Backend** | Node.js (v18+), Express 4, Helmet, Morgan, Express Rate Limit, Express Validator |
| **Database** | MongoDB with Mongoose (Atlas Cloud or Local MongoDB) |
| **Testing** | Node.js Test Runner with in-memory MongoDB runner (`mongodb-memory-server`) |

---

## 📸 Screenshots

| View | Preview |
|---|---|
| **Dashboard View** | `<!-- Placeholder: Dashboard showing summary cards, distribution chart, and follow-ups -->`<br>![Dashboard Placeholder](https://via.placeholder.com/800x450/131c2e/f8fafc?text=Dashboard+Overview+%2B+Metrics) |
| **Applications Table View** | `<!-- Placeholder: Applications table with stage tabs and debounced search -->`<br>![Table Placeholder](https://via.placeholder.com/800x450/131c2e/f8fafc?text=Applications+Table+%2B+Stage+Tabs) |
| **Kanban Pipeline View** | `<!-- Placeholder: Kanban columns grouped by stage with move arrows -->`<br>![Kanban Placeholder](https://via.placeholder.com/800x450/131c2e/f8fafc?text=Kanban+Board+View) |
| **Add / Edit Form** | `<!-- Placeholder: Application form with validation errors and date pickers -->`<br>![Form Placeholder](https://via.placeholder.com/800x450/131c2e/f8fafc?text=Application+Form+%2B+Validation) |

---

## 🚀 Setup & Installation

### 1. Prerequisites
- **Node.js 18+** (`node -v`)
- **MongoDB**: A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB on port 27017).

---

### 2. Configure Environment Variables

#### Backend (`server/.env`)
Create `InternshipLog/server/.env` (or copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/internshiplog?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
```
> **MongoDB Atlas Setup Tip**:
> 1. In Atlas, go to **Database Access** -> create a database user with username and password.
> 2. Go to **Network Access** -> click **Add IP Address** -> select **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
> 3. In **Database** -> click **Connect** -> copy the connection string and paste it into `MONGO_URI`.

#### Frontend (`client/.env`)
Create `InternshipLog/client/.env` (optional, defaults to proxying `/api`):
```env
VITE_API_URL=http://localhost:5000
```

---

### 3. Install Dependencies

```bash
# In server directory
cd InternshipLog/server
npm install

# In client directory
cd ../client
npm install
```

---

### 4. Seed Sample Data

To populate the database with **12 realistic applications** across all 6 stages (with sample upcoming and overdue follow-ups):

```bash
cd InternshipLog/server
npm run seed
```

---

### 5. Run the Applications

#### Terminal 1: Backend Server
```bash
cd InternshipLog/server
npm run dev
```
- API Base: `http://localhost:5000/api/applications`
- Health Check: `http://localhost:5000/api/health`

#### Terminal 2: Frontend Client
```bash
cd InternshipLog/client
npm run dev
```
- Web Application: **`http://localhost:5173`**

---

## 📡 API Endpoint Reference

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check & database connection status |
| `GET` | `/api/applications` | `?stage=`, `?search=` | List all applications (supports search & filter) |
| `POST` | `/api/applications` | — | Create a new application (validates required fields) |
| `GET` | `/api/applications/stats/summary` | — | Summary counts per stage & upcoming deadlines |
| `GET` | `/api/applications/followups/upcoming` | `?days=` (default 7) | Fetch upcoming follow-ups with `overdue` flags |
| `GET` | `/api/applications/:id` | — | Fetch single application by ObjectId |
| `PUT` | `/api/applications/:id` | — | Update application details or stage |
| `DELETE` | `/api/applications/:id` | — | Remove application |

---

## 🧪 Automated Test Suites

The backend includes comprehensive test suites running against an in-memory database:

```bash
cd InternshipLog/server

# 1. Validation & Middleware Tests
node test/validation.test.js

# 2. Stats & Precedence Order Tests
node test/statsAndFollowups.test.js

# 3. All 19 API Endpoints & Error Cases Test
node test/endpoints.test.js

# 4. Full End-to-End Lifecycle Test (Create -> Edit -> Move Stage -> Set Follow-up -> Delete)
node test/e2eLifecycle.test.js
```
All suites run automated assertions verifying HTTP status codes, payloads, error arrays, and database mutations.


---

## ☁️ Deployment Guide (Render + Vercel / Netlify)

### 1. Backend Deployment on [Render](https://render.com)
1. Create a new **Web Service** on Render and link your GitHub repository.
2. Configure settings:
   - **Root Directory**: `InternshipLog/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables in the Render dashboard:
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/internshiplog?retryWrites=true&w=majority`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-app.vercel.app` (your frontend domain to allow CORS)
   - `PORT`: `5000`

---

### 2. Frontend Deployment on [Vercel](https://vercel.com) / [Netlify](https://netlify.com)
1. Import your GitHub repository into Vercel or Netlify.
2. Configure project settings:
   - **Root Directory**: `InternshipLog/client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com`
4. Deploy! All API calls from the frontend will route directly to your Render backend with proper CORS authorization.

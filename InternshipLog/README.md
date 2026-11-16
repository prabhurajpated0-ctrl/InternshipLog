# 🎓 InternshipLog

A personal internship application tracker for students to organize, track, and manage applications, interview stages, and follow-ups.

Built with **React (Vite)** on the frontend, and **Node.js + Express + MongoDB (Mongoose)** on the backend.

---

## 📁 Project Structure

```text
InternshipLog/
├── server/
│   ├── src/
│   │   ├── config/db.js                  # MongoDB connection & diagnostics
│   │   ├── models/Application.js          # Mongoose schema (company, role, stage, etc.)
│   │   ├── middleware/
│   │   │   ├── validate.js                # Request validation
│   │   │   └── errorHandler.js            # 404 & centralized error handler
│   │   ├── controllers/
│   │   │   └── applicationController.js   # CRUD, upcoming follow-ups & stage stats
│   │   ├── routes/
│   │   │   └── applications.js            # Express router
│   │   ├── app.js                         # Express app & middleware setup
│   │   └── server.js                      # Server startup & port listener
│   ├── test/
│   │   └── validation.test.js             # Validation & stage unit tests
│   ├── .env.example                       # Environment variables template
│   ├── .env                               # Local secrets (git ignored)
│   └── package.json
└── client/
    ├── src/
    │   ├── api/applicationApi.js          # API client for backend communication
    │   ├── components/
    │   │   ├── StatsBanner.jsx            # Stage count badges & total count
    │   │   ├── UpcomingFollowUps.jsx      # Upcoming reminders & follow-up notes
    │   │   ├── ApplicationCard.jsx        # Application card with quick actions
    │   │   └── ApplicationForm.jsx        # Add & Edit modal/inline form
    │   ├── hooks/useApplications.js       # State management & data sync
    │   ├── pages/Dashboard.jsx            # Main dashboard view
    │   ├── styles/index.css               # Responsive styling
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js                     # Vite configuration with /api proxy
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js 18+** (`node -v`)
- **MongoDB** (A free [MongoDB Atlas](https://www.mongodb.com/atlas/database) cluster or a local MongoDB instance)

---

### 2. Configure Environment Variables
Inside `InternshipLog/server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/internshiplog?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
```
> **Note**: Replace `<username>` and `<password>` with your MongoDB Atlas database user credentials. If using local MongoDB, use `mongodb://127.0.0.1:27017/internshiplog`.

---

### 3. Run the Backend (`/server`)

```bash
cd InternshipLog/server
npm install
npm run dev
```
- Server starts at `http://localhost:5000`
- Health check available at `http://localhost:5000/health`
- Run validation tests: `node test/validation.test.js`

---

### 4. Run the Frontend (`/client`)

Open a second terminal window:

```bash
cd InternshipLog/client
npm install
npm run dev
```
- Client runs at `http://localhost:5173`
- All `/api` requests are automatically proxied to `http://localhost:5000`

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/applications` | Create a new internship application |
| `GET` | `/api/applications?stage=&search=` | List applications (supports stage filtering & text search) |
| `GET` | `/api/applications/:id` | Get details of a single application |
| `PUT` | `/api/applications/:id` | Update an existing application |
| `DELETE` | `/api/applications/:id` | Delete an application |
| `GET` | `/api/applications/followups/upcoming` | Fetch upcoming follow-up reminders |
| `GET` | `/api/applications/stats/summary` | Summary metrics grouped by stage |

### Supported Stages
`Wishlist`, `Applied`, `OA/Screening`, `Interview`, `Offer`, `Rejected`

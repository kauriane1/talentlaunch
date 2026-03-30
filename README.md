# TalentLaunch Rwanda

A full-stack web app for Rwandan talent discovery.

- Frontend: HTML/CSS/JS with separate admin/dashboard/mentor/workshop/talent pages
- Backend: Node.js + Express + PostgreSQL (Neon / Render / local Postgres)
- Auth: JWT + role-based access (admin/user)

---

## 📋 Prerequisites

1. Git
2. Node.js (v18+)
3. npm (v9+)
4. PostgreSQL (local) or Neon / other managed Postgres provider
5. cURL (optional for endpoint tests)

Verify:

```bash
node -v
npm -v
psql --version
git --version
```

---

## 🔧 Install repository

```bash
cd /workspaces
git clone https://github.com/kauriane1/talentlaunch.git
cd talentlaunch
```

---

## 📦 Install dependencies

```bash
npm install
```

---

## 🗄️ Database setup

### Option A: Local Postgres

```bash
sudo -u postgres createdb talentlaunch
```

### Option B: Neon / cloud Postgres

1. Create a project + database in Neon.
2. Copy the `DATABASE_URL` connection string.

---

## 🔐 Environment variables

Create a `.env` file at project root:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=yourStrongSecretKey
PORT=5000
```

Alternative variables (if your code uses individual vars):
- `PGUSER`
- `PGPASSWORD`
- `PGHOST`
- `PGPORT`
- `PGDATABASE`

---

## 🧩 Database schema initialization

If `config/schema.sql` exists:

```bash
psql "$DATABASE_URL" -f config/schema.sql
```

If not, run equivalent SQL manually using Postgres CLI (example from codebase fitness). Ensure tables exist:
- `users`
- `mentors`
- `workshops`
- `talents`

---

## 👤 Seed admin user

Admin credentials:
- Email: `admin@talentlaunch.rw`
- Password: `Admin1234`

The password is already hashed in seed script form:
`$2a$12$8lgiZNKr1.4UYAlvQ6M2duAgaP0HcXiQNrqBaxjsiWSIdbZY5wwL.`

Run SQL if admin row is missing:

```sql
INSERT INTO users (name, email, password, role, location)
VALUES ('Admin User', 'admin@talentlaunch.rw',
'$2a$12$8lgiZNKr1.4UYAlvQ6M2duAgaP0HcXiQNrqBaxjsiWSIdbZY5wwL.',
'admin', 'Kigali');
```

---

## ▶️ Run the app locally

```bash
npm start
```

Backend should run at `http://localhost:5000`.
Health check:

```bash
curl http://localhost:5000/api/health
```

---

## 🌐 Frontend URLs

Open in browser:
- `/index.html`
- `/login.html`
- `/dashboard.html`
- `/admin.html`
- `/mentors.html`
- `/workshops.html`
- `/showcase.html`
- `/profile.html`

> If you run through a static server, use `http://localhost:5000/<file>` or use local file path if served separately.

---

## 🔐 Authentication flow

1. Login (`/login.html` / `POST /api/auth/login`)
2. Save JWT token to `localStorage`
3. Admin pages require role `admin`
4. If `Access Denied`, clear `localStorage` and re-login

---

## 🧾 API endpoints

- `POST /api/auth/login` (body: `email`, `password`)
- `POST /api/auth/register` (body: `name`, `email`, `password`, `location`)
- `POST /api/auth/admin` (admin only)
- `GET /api/mentors`
- `POST /api/mentors` (requires token+admin)
- `GET /api/workshops`
- `POST /api/workshops` (requires token+admin)
- `GET /api/talents`
- `POST /api/talents` (requires token)

Include header:

```
Authorization: Bearer <token>
```

---

## 🔎 Common issues & fixes

- `ECONNREFUSED` or cannot connect: check `DATABASE_URL`, DB running
- `JWT malformed`/`invalid token`: verify `JWT_SECRET` and front-end token persistence
- 401/403 admin endpoints: use admin account or assign `role='admin'`
- If UI shows stale data, clear browser cache and localStorage

---

## 🚀 Deployment notes

Use Render/Neon/Heroku:
- Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Start command: `npm start`

Add `docker-compose.yml` in future to standardize local and production setups.

---

## ✅ Quick checklist

1. `npm install`
2. DB created and accessible
3. `.env` set with `DATABASE_URL` + `JWT_SECRET`
4. Schema loaded
5. Admin user exists
6. `npm start` and `/api/health` works
7. Login from `login.html`
8. Create mentor/workshop/talent and verify data

---

## 📖 Support

For issues, inspect `server.js`, `routes/`, and `controllers/`.
If you want automation, I can add a `setup.sh` and `docker-compose.yml` next.

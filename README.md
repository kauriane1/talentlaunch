# TalentLaunch Rwanda

A simple full-stack web app for Rwandan talent discovery.

- Frontend: HTML/CSS/JS (admin/dashboard/showcase)
- Backend: Node.js + Express + PostgreSQL (Neon / Render)
- Auth: JWT + role-based admin protection

## Quick start (local)

1. Install dependencies in the project root:
   ```bash
   npm install
   ```
2. Create a local Postgres database and set `DATABASE_URL` or Postgres env vars in `.env`.
3. Start the API locally:
   ```bash
   npm start
   ```
4. The backend will be available at `http://localhost:5000/api/health`.

> For deployment, use Render or any Node.js/Postgres hosting with `DATABASE_URL` set to your Neon connection string.

## Admin account (pre-seeded)

- Email: `admin@talentlaunch.rw`
- Password: `Admin1234`

> If not present, run once in Postgres:
> ```sql
> INSERT INTO users (name,email,password,role,location)
> VALUES ('Admin User','admin@talentlaunch.rw','$2a$12$8lgiZNKr1.4UYAlvQ6M2duAgaP0HcXiQNrqBaxjsiWSIdbZY5wwL.','admin','Kigali');
> ```

## How to use

1. Login using admin credentials.
2. Visit admin panel: `/admin.html`.
3. Add mentors, workshops, talents.
4. Use dashboard for data stats.

## API endpoints

- `POST /api/auth/login` (body: email, password)
- `POST /api/auth/register` (name, email, password, location)
- `POST /api/auth/admin` (admin only)
- `GET /api/mentors`, `POST /api/mentors` (admin)
- `GET /api/workshops`, `POST /api/workshops` (admin)
- `GET /api/talents`, `POST /api/talents` (user)

## Notes

- `admin.html` requires valid auth token and admin role.
- If app shows Access Denied, clear localStorage token and login again.
- In GitHub Codespaces, use port 3000 URL for UI and 5000 for API.

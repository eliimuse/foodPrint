# 🍽️ FoodPrint

**Know how much to cook.** A hostel mess app that cuts food waste. Hostelers confirm next-day meals by 8 PM IST; the mess manager sees confirmed headcounts, ML-predicted turnout, and recommended prep quantities.

## Features

- **Hostelers:** browse the menu, confirm next-day meals, pick options (e.g. Chicken vs Paneer), view history
- **Mess manager:** manage the menu, dashboard with headcount and per-dish demand, log consumption and waste
- **Platform:** role-based access, auth-gated actions, 8 PM IST cutoff enforced in the database

## Tech Stack

React + TypeScript + Tailwind · Supabase (Postgres, Auth, RLS) · Recharts · FastAPI ML service (planned)

## Status

- [x] Welcome and Home pages, auth-gated navigation
- [x] Supabase authentication with roles
- [ ] Menu display and admin management
- [ ] Attendance with 8 PM cutoff
- [ ] Mess manager dashboard
- [ ] ML turnout and quantity prediction
- [ ] Deployment

## Setup

```bash
git clone <your-repo-url>
cd foodprint
npm install
```

1. Create a Supabase project and run the SQL scripts from `/supabase` in the SQL Editor.
2. Add a `.env` file:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. `npm run dev`
4. Promote your first mess manager in the SQL Editor:
   ```sql
   update public.profiles set role = 'mess_manager'
   where id = (select id from auth.users where email = 'manager@example.com');
   ```

> Never use the `service_role` key in frontend code.

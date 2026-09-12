<div align="center">

# 🏆 MLBB 5v5 Tournament

### Fan Vote Platform

**A premium, realtime voting platform for a 24-player MLBB tournament.**

<br />

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
<img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
<img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer" alt="Framer Motion" />

<br />
<br />

**Secure voting • Realtime leaderboard • Admin dashboard • Responsive UI**

</div>

---

## 🎮 About

**MLBB 5v5 Tournament — Fan Vote** is a full-stack fan-voting platform built for a **24-player Mobile Legends: Bang Bang tournament**.

The application provides a polished tournament experience for fans while keeping voting, authentication, authorization, and database operations server-controlled.

<table>
<tr>
<td width="50%">

### 👥 For Fans

* View tournament players
* Browse teams and roles
* Cast a vote
* View live rankings
* See realtime vote counts
* Responsive mobile experience

</td>
<td width="50%">

### 👑 For Admins

* Secure authentication
* Tournament management
* Player management
* Live vote monitoring
* Protected database operations
* Administrative controls

</td>
</tr>
</table>

---

# ✨ Highlights

<table>
<tr>
<td align="center" width="25%">

### 🗳️

**Secure Voting**

One voter can cast only one vote.

</td>
<td align="center" width="25%">

### ⚡

**Realtime**

Leaderboard updates without polling.

</td>
<td align="center" width="25%">

### 🔐

**Protected**

RLS + server authorization.

</td>
<td align="center" width="25%">

### 📱

**Responsive**

Designed for mobile and desktop.

</td>
</tr>
</table>

---

# 🧱 Technology

<div align="center">

| Layer          | Technology                |
| -------------- | ------------------------- |
| Framework      | **Next.js 16 App Router** |
| Language       | **TypeScript**            |
| UI             | **React**                 |
| Styling        | **Tailwind CSS v4**       |
| Animation      | **Framer Motion**         |
| Backend        | **Supabase**              |
| Database       | **PostgreSQL**            |
| Authentication | **Supabase Auth**         |
| Realtime       | **Supabase Realtime**     |
| Storage        | **Supabase Storage**      |

</div>

---

# 📁 Architecture

```text
MLBB Tournament
│
├── public/
│   ├── players/
│   └── fonts/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── vote/
│   │   │       └── route.ts
│   │   │
│   │   ├── admin/
│   │   └── ...
│   │
│   ├── components/
│   │
│   ├── hooks/
│   │   └── useRealtimeTournament.ts
│   │
│   ├── lib/
│   │   ├── voter.ts
│   │   └── ...
│   │
│   └── middleware.ts
│
├── supabase/
│   └── schema.sql
│
├── .env.local.example
├── package.json
└── README.md
```

---

# 🚀 Quick Start

## Requirements

* Node.js 20+
* npm
* Supabase project
* Git recommended

Check your installation:

```bash
node -v
npm -v
```

---

## 1. Install

```bash
npm install
```

---

## 2. Configure Supabase

Create a project in Supabase.

Open:

**Supabase Dashboard → SQL Editor**

Run:

```text
supabase/schema.sql
```

The schema creates:

* `players`
* `voters`
* `votes`
* `tournament`
* `admins`
* `cast_vote()`
* `voter_status()`
* indexes
* constraints
* RLS policies
* realtime configuration
* placeholder 24-player roster

> **Important:** Run the complete schema before testing the application.

---

# 👤 Add the Tournament Roster

Replace the placeholder players with the actual tournament roster.

Each player should have:

```text
name
team
role
image_url
sort_order
```

### Recommended image hosting

Use either:

**Supabase Storage**

or:

```text
public/players/
```

Example:

```text
public/players/player-name.webp
```

Then reference it as:

```text
/players/player-name.webp
```

### Recommended formats

* WebP
* AVIF
* Optimized JPEG/PNG

---

# 👑 Create an Administrator

Go to:

**Supabase → Authentication → Users**

Create the admin account.

Copy the user's Auth ID and add it to:

```text
public.admins
```

An administrator must exist in both:

```text
auth.users
```

and:

```text
public.admins
```

Authentication determines **who the user is**.

The `admins` table determines **whether the user is an administrator**.

---

# 🔑 Environment Variables

Create:

```text
.env.local
```

from:

```text
.env.local.example
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

<div align="center">

### ⚠️ SECURITY WARNING

</div>

`SUPABASE_SERVICE_ROLE_KEY` is a **server-only secret**.

Never:

* Prefix it with `NEXT_PUBLIC_`
* Import it into client components
* Put it in browser code
* Commit it to Git
* Display it in logs
* Add it to public documentation

It should only be used by trusted server-side code.

---

# ▶️ Run Locally

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

---

# 🗳️ Voting System

Voting follows a server-authoritative flow:

```text
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       ▼
┌────────────────┐
│ POST /api/vote │
└───────┬────────┘
        │
        ▼
┌────────────────────┐
│ Validate request   │
│ + voter identity   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ cast_vote() RPC    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ PostgreSQL atomic  │
│ transaction        │
└────────┬───────────┘
         │
         ├──────────────► Insert vote
         │
         └──────────────► Update vote count
                              │
                              ▼
                    ┌──────────────────┐
                    │ Supabase         │
                    │ Realtime         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Live Leaderboard │
                    └──────────────────┘
```

---

# 🔒 Anti-Duplicate Voting

The system uses **multiple layers of protection**.

### 1. Secure voter cookie

A random UUID identifies the voter.

It is stored in an:

```text
httpOnly cookie
```

Implementation:

```text
src/lib/voter.ts
```

The identity is **not stored in localStorage**.

---

### 2. Database uniqueness

The `votes` table has a unique constraint/index on:

```text
voter_id
```

This is the actual database-level duplicate protection.

Even if two requests arrive at almost exactly the same time, PostgreSQL cannot create two vote records for the same voter.

---

### 3. Atomic transaction

`cast_vote()` performs the required operations atomically.

Conceptually:

```sql
BEGIN;

verify voter;
verify tournament;
verify player;
insert vote;
increment player vote count;

COMMIT;
```

If an operation fails, the transaction does not leave behind a partial vote.

---

# 🛡️ Security Model

The application follows a **server-authoritative architecture**.

```text
                    ┌───────────────┐
                    │    Browser    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Server API    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Authorization │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ PostgreSQL    │
                    │ Constraints   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ RLS Policies  │
                    └───────────────┘
```

The browser should never be trusted to determine:

* Vote counts
* Admin privileges
* Tournament state
* Authorization
* Database permissions
* Voter identity

---

# ⚡ Realtime

The application uses Supabase Realtime.

Implementation:

```text
src/hooks/useRealtimeTournament.ts
```

The leaderboard and admin interface subscribe to relevant changes on:

```text
players
tournament
```

There is no unnecessary per-row polling loop.

### Result

```text
Vote
  ↓
Database
  ↓
Realtime event
  ↓
Connected clients
  ↓
Leaderboard updates
```

---

# 👑 Admin Protection

Admin access uses multiple authorization layers.

### Middleware

```text
src/middleware.ts
```

protects:

```text
/admin/**
```

and requires an authenticated Supabase session.

### Server-side verification

The admin page checks that the authenticated user exists in:

```text
public.admins
```

### Database authorization

PostgreSQL independently uses:

```text
is_admin()
```

for protected administrative operations.

Therefore:

> Removing or bypassing a frontend restriction does not grant database administrator access.

---

# 🔤 Fonts

The original visual specification uses:

* **Coolvetica Rg**
* **AppleGaramond**

These are commercial fonts.

No licensed font binaries are bundled with this repository.

If you have the appropriate webfont licenses, place the files inside:

```text
public/fonts/
```

```text
Coolvetica Rg.otf
AppleGaramond-Light.ttf
AppleGaramond.ttf
```

The existing `@font-face` rules in:

```text
src/app/globals.css
```

will automatically use them.

### ⚠️ Licensing

Do not commit commercial font files to a public repository unless your license permits redistribution.

---

# 🧪 Production Checklist

<details>
<summary><strong>Database</strong></summary>

<br />

* [ ] Supabase project created
* [ ] `schema.sql` executed
* [ ] 24-player roster configured
* [ ] Player images verified
* [ ] Tournament configuration verified
* [ ] RLS enabled
* [ ] Unique voter constraint exists
* [ ] Voting RPC exists
* [ ] RPC permissions restricted
* [ ] Realtime configured

</details>

<details>
<summary><strong>Authentication</strong></summary>

<br />

* [ ] Admin Auth account created
* [ ] Admin ID added to `public.admins`
* [ ] `/admin` requires authentication
* [ ] Non-admin users cannot perform admin operations
* [ ] Admin authorization works server-side

</details>

<details>
<summary><strong>Voting</strong></summary>

<br />

* [ ] First vote succeeds
* [ ] Second vote is rejected
* [ ] Refresh cannot create another vote
* [ ] Concurrent requests cannot create duplicates
* [ ] Vote count increments correctly
* [ ] Invalid player IDs are rejected
* [ ] Closed tournament rejects votes

</details>

<details>
<summary><strong>Frontend</strong></summary>

<br />

* [ ] Desktop tested
* [ ] Mobile tested
* [ ] Loading states tested
* [ ] Error states tested
* [ ] Empty states tested
* [ ] Player images load
* [ ] Animations are smooth
* [ ] Realtime updates work

</details>

---

# 🏗️ Production Build

Before deployment:

```bash
npm run build
```

If successful:

```bash
npm run start
```

Test the production build locally before publishing.

---

# 🚢 Deployment

The application requires a hosting environment capable of running Next.js.

Configure these environment variables on the production server:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key must be configured as a **server-side secret**.

Never expose it through:

```text
NEXT_PUBLIC_*
```

---

# 🧰 Troubleshooting

<details>
<summary><strong>Database error querying schema</strong></summary>

<br />

Verify:

1. Supabase project is online.
2. Supabase URL is correct.
3. Anon key is correct.
4. `schema.sql` was executed.
5. Required tables exist.
6. Required RPC functions exist.
7. RLS policies exist.
8. The application is connected to the correct Supabase project.

</details>

<details>
<summary><strong>Voting does not work</strong></summary>

<br />

Check:

```text
POST /api/vote
```

Then verify:

* voter cookie exists
* player ID is valid
* tournament is open
* `cast_vote()` exists
* RPC permissions are correct
* service-role key is configured server-side

</details>

<details>
<summary><strong>Admin login works but admin access fails</strong></summary>

<br />

Make sure the authenticated user's ID exists in:

```text
public.admins
```

Authentication alone does not grant administrator privileges.

</details>

<details>
<summary><strong>Leaderboard does not update</strong></summary>

<br />

Check:

* Supabase Realtime configuration
* `players` realtime updates
* `tournament` realtime updates
* `useRealtimeTournament.ts`
* browser console for realtime connection errors

</details>

---

# 🔐 Security Rules

### Never commit

```text
.env
.env.local
.env.production
service-ro


le keys
private credentials
licensed commercial font binaries
```

### Never expose

```text
SUPABASE_SERVICE_ROLE_KEY
```

### Always enforce authorization

Authorization should be checked on the server/database rather than relying only on UI visibility.

---

# 📜 License

Add the actual project license here before publishing.

Third-party assets may have separate licenses, including:

* Player photographs
* Team logos
* MLBB branding
* Fonts
* Icons
* Images
* Other third-party assets

Ensure you have appropriate permission to use and redistribute them.

---

<div align="center">

## 🏆 MLBB 5v5 Tournament

**Fan Vote • Realtime • Secure • Built for the tournament**

<br />

Made with ❤️ using Next.js + Supabase
<center>BIGBBB</center>
</div>

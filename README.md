# courses_web: the school's public website

What a stranger sees: what the school is, which groups are taking students, who teaches them and
when the classes are, and one form to apply for a place. There is no login and no account here.

Next.js 16, React 19, Prisma 7, Tailwind 4, Node 24; az (default), en, ru. Port **3002**.

## How it fits with the other apps
It is the fourth app on the same Postgres database as the Student Diary (`courses_student`), the
Teacher App (`courses_teacher`) and the Admin Panel (`courses-admin`). The apps never call each
other; they share rows.

1. In the **Admin Panel** an admin ticks *Show on the website* on a course and a teacher, and on a
   group sets seats, the monthly price and *Open for applications*.
2. This site shows those rows. A group is public when it is open for applications, its course is
   shown and not archived, and its term is neither locked nor over.
3. A visitor sends the form. One row is written to `applications`; the visitor gets a
   confirmation email and `ADMIN_NOTIFY_EMAIL` gets a notice.
4. In the Admin Panel, **Applications**: approve (creates the student account with a one-time
   password, or reuses the account with that email, and enrols it) or reject.

## Rules
- **Reads** go only through `src/lib/public-data.ts`: every query lists its columns, and none
  returns an email, a phone, a meeting link, a student's name, a mark or attendance. Tests enforce it.
- **Writes**: only `application.create`, in `src/lib/apply.ts`. A test enforces that too.
- **Never run `prisma migrate` here.** Only the Student Diary migrates. `prisma/schema.prisma` and
  the other files listed in `scripts/sync-check.mjs` are copies of the Student Diary's: edit them
  there, copy them here, and run `npm run sync:check`.
- The school's name and contacts are placeholders until `NEXT_PUBLIC_SCHOOL_NAME`, `CONTACT_PHONE`,
  `CONTACT_EMAIL` (and optionally `CONTACT_WHATSAPP`) are set. See `.env.example`.

## Run
```bash
npm install
cp .env.example .env      # point DATABASE_URL at the same database as the other apps
npm run dev               # http://localhost:3002
```
`npm run build` reads the database (public pages are prerendered and refreshed about every minute),
so the database must have the `public_website` migration from the Student Diary applied.

## Check
```bash
npm run typecheck && npm run lint && npm test && npm run sync:check
# needs a throwaway database whose name ends in _test, with the migrations applied; it is wiped:
TEST_DATABASE_URL=postgresql://localhost:5432/courses_test npm run test:integration
```

## Deploy
A fourth Vercel project in Frankfurt on the same Neon database (pooled `DATABASE_URL`). Deploy
order: **Student (runs the migration), Teacher, Admin, then Web.** Set `APPLY_SALT` (32+ random
characters); the form refuses to work on Vercel without it.

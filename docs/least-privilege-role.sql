-- A database role for the public website with only what the site needs (security audit, finding 8).
--
-- Why: the website is the only app any stranger can reach, and it shares the school's database. With the owner's
-- DATABASE_URL, a bug in the site would expose every student's marks and every email. With this role it can read the
-- public rows below and insert applications, and nothing else: no marks, no passwords, no emails, no deletes.
--
-- How (once, as the database owner, in the Neon SQL editor or psql). Replace the placeholder password with a long random
-- one, then put a pooled connection string for this role in the website's Vercel project as DATABASE_URL:
--   postgresql://courses_web_app:<password>@<pooled host>/<db>?sslmode=verify-full
-- The other three apps keep the owner's URL. Run the migrations (Student Diary) as the owner, never as this role.
-- Re-run the GRANT lines after a migration that adds a column the website reads.

CREATE ROLE courses_web_app LOGIN PASSWORD 'CHANGE-ME-to-a-long-random-password' NOINHERIT NOCREATEDB NOCREATEROLE;

GRANT CONNECT ON DATABASE neondb TO courses_web_app;        -- use your database's name
GRANT USAGE ON SCHEMA public TO courses_web_app;

-- Read: what the site shows (src/lib/public-data.ts).
GRANT SELECT ON courses, groups, terms, schedule_rules, lessons, enrollments TO courses_web_app;
-- Teachers: only the columns the site shows or filters by. Not email, not password_hash, not the privacy columns.
GRANT SELECT (id, name, bio, show_on_website, active, role) ON users TO courses_web_app;

-- The site's only write (src/lib/apply.ts): insert an application, and read them back to limit repeats.
-- No UPDATE and no DELETE: the Admin Panel approves, and the Student Diary's retention job deletes.
GRANT SELECT, INSERT ON applications TO courses_web_app;

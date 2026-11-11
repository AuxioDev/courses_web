// Fails when a file shared with the Student Diary has drifted.
// Run from this repo: npm run sync:check
// The Student Diary is expected next to this repo; set STUDENT_REPO to look elsewhere.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const studentRepo = path.resolve(process.env.STUDENT_REPO ?? "../courses_student");

// Must stay byte-for-byte identical. Edit the Student copy, then copy it here.
const FILES = [
  "prisma/schema.prisma",
  "src/app/globals.css",
  "src/components/ui.tsx",
  "src/i18n/config.ts",
  "src/i18n/format.ts",
  "src/instrumentation.ts",
  "src/lib/db.ts",
  "src/lib/email.ts",
  "test/db.ts",
  "test/server-only.ts",
  "vitest.config.ts",
  "vitest.integration.config.ts",
];

if (!existsSync(path.join(studentRepo, "package.json"))) {
  console.error(`Student Diary not found at ${studentRepo}.`);
  process.exit(1);
}

let failed = false;
for (const file of FILES) {
  const theirs = path.join(studentRepo, file);
  if (!existsSync(theirs) || !existsSync(file)) {
    console.error(`MISSING  ${file}`);
    failed = true;
  } else if (!readFileSync(theirs).equals(readFileSync(file))) {
    console.error(`DRIFTED  ${file}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nCopy the Student Diary's version over the files above.");
  process.exit(1);
}
console.log(`${FILES.length} shared files match the Student Diary.`);

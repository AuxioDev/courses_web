import "server-only";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

// The school's own pictures live in public/brand and are used only when they are there: the logo, up to three
// screenshots of the Student Diary, and one photograph per teacher. Nothing is shown in their place, so the page
// never carries a placeholder picture.
//   public/brand/logo.svg  (or .png, .webp)
//   public/brand/diary/01-timetable.png, 02-homework.png ...   (the file name after the number is the caption)
//   public/brand/teachers/<teacher id>.jpg  (or .jpeg, .png, .webp)
const root = path.join(process.cwd(), "public", "brand");
const IMAGE = /\.(png|jpe?g|webp|avif)$/i;

export function brandLogo() {
  for (const ext of ["svg", "png", "webp"]) if (existsSync(path.join(root, `logo.${ext}`))) return `/brand/logo.${ext}`;
  return null;
}

// "02-homework-to-hand-in.png" becomes "Homework to hand in".
function caption(file: string) {
  const text = file.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

export function diaryShots() {
  const dir = path.join(root, "diary");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE.test(f))
    .sort()
    .slice(0, 3)
    .map((f) => ({ src: `/brand/diary/${f}`, caption: caption(f) }));
}

export function teacherPhoto(id: string) {
  if (!/^[\w-]+$/.test(id)) return null;
  for (const ext of ["jpg", "jpeg", "png", "webp"]) if (existsSync(path.join(root, "teachers", `${id}.${ext}`))) return `/brand/teachers/${id}.${ext}`;
  return null;
}

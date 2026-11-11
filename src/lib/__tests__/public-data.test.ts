// Reads the source of the one file the public site may query through. Fails when a query stops
// listing its columns, or names something the public must never see. Runs without a database;
// public-data.int.test.ts checks the same promise against real rows.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel: string) => readFileSync(path.join(src, rel), "utf8");
// Comments explain what is left out, so they may name it.
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "generated" || name === "__tests__" ? [] : files(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("public data", () => {
  const source = code(read("lib/public-data.ts"));

  it("never names a private column", () => {
    for (const word of ["email", "passwordHash", "meetingUrl", "phone", "guardian", "materials", "topic", "attendance", "marks", "submissions", "note", "ipHash", "student: {"]) {
      // `student: { active: true }` inside the enrolment count is a filter, not a selected column.
      const found = source.split("\n").filter((line) => line.includes(word) && !line.includes("where: { status:"));
      expect(found, `"${word}" in public-data.ts`).toEqual([]);
    }
  });

  it("lists columns with select on every query, and never uses include", () => {
    expect(source).not.toMatch(/\binclude\s*:/);
    // Each query's own arguments: from its opening bracket to the one that closes it.
    const queries = [...source.matchAll(/db\.\w+\.(findMany|findFirst|findUnique|count)\(/g)].map((m) => {
      let depth = 0;
      for (let i = m.index + m[0].length - 1; i < source.length; i++) {
        if (source[i] === "(") depth++;
        else if (source[i] === ")" && --depth === 0) return source.slice(m.index, i + 1);
      }
      return source.slice(m.index);
    });
    expect(queries.length).toBeGreaterThanOrEqual(13);
    for (const query of queries) expect(query, query).toMatch(/\bselect\b/);
  });

  it("is the only place pages and components reach the database", () => {
    const allowed = new Set(["lib/db.ts", "lib/public-data.ts", "lib/apply.ts", "lib/apply-email.ts"]);
    const offenders = files(src)
      .map((file) => path.relative(src, file))
      .filter((file) => !allowed.has(file) && /from "(@\/lib\/db|\.\/db)"/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it("the website writes to the applications table and nothing else", () => {
    const writes = files(src).flatMap((file) =>
      [...code(readFileSync(file, "utf8")).matchAll(/db\.(\w+)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/g)].map(
        (m) => `${m[1]}.${m[2]}`,
      ),
    );
    expect(writes).toEqual(["application.create"]);
    expect(code(readFileSync(path.join(src, "lib/apply.ts"), "utf8"))).not.toMatch(/\$executeRaw|\$queryRaw|\$transaction/);
  });
});

import { db } from "./db";
import { publicCourseWhere, publicGroupWhere, publicTeacherWhere } from "./public-filters";

// "Is there a public page at this address?", for the proxy. A page that suspends while it loads has already
// started streaming, so its status is fixed at 200 even when it then answers "not found" (a soft 404). Asking
// before the page renders lets the proxy rewrite a missing address to the not-found route, which answers 404.
//
// One indexed count. Only a "yes" is remembered (for 30 seconds), so a busy page costs the database almost
// nothing. A "no" is never remembered: the admin publishes a group and sends the link a moment later, and a
// remembered "no" would answer that link with a 404. Made-up ids are not repeated by crawlers, so remembering them
// would save nothing anyway.

export type PublicKind = "groups" | "courses" | "teachers";

const TTL_MS = 30_000;
const MAX_ENTRIES = 1000;
const remembered = new Map<string, number>(); // address -> remembered until

// The ids this system creates are letters and digits; anything else is not worth a query.
const ID = /^[A-Za-z0-9_-]{1,64}$/;

async function lookup(kind: PublicKind, id: string) {
  if (kind === "groups") return (await db.group.count({ where: { id, ...publicGroupWhere() } })) > 0;
  if (kind === "courses") return (await db.course.count({ where: { id, ...publicCourseWhere } })) > 0;
  return (await db.user.count({ where: { id, ...publicTeacherWhere } })) > 0;
}

export async function publicExists(kind: PublicKind, id: string, now = Date.now()): Promise<boolean> {
  if (!ID.test(id)) return false;
  const key = `${kind}:${id}`;
  const until = remembered.get(key);
  if (until !== undefined && until > now) return true;

  const exists = await lookup(kind, id);
  if (exists) {
    if (remembered.size >= MAX_ENTRIES) remembered.clear();
    remembered.set(key, now + TTL_MS);
  }
  return exists;
}

export function forgetPublicExists() {
  remembered.clear();
}

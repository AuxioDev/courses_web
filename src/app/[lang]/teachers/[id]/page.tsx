import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";
import { getTeacher } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { Empty } from "@/components/ui";
import { GroupList } from "@/components/group-list";
import { BackLink, Prose } from "@/components/page-head";
import { Initials } from "@/components/teacher-list";

type Props = PageProps<"/[lang]/teachers/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ locale }, { id }] = await Promise.all([getI18n(), params]);
  const teacher = await getTeacher(id);
  return teacher ? pageMeta(locale, `/teachers/${id}`, teacher.name, teacher.bio) : {};
}

// The address decides the content, so the page waits for it on the server.
export const instant = false;

export default async function TeacherPage({ params }: Props) {
  const [{ locale, t }, { id }] = await Promise.all([getI18n(), params]);
  const teacher = await getTeacher(id);
  if (!teacher) notFound();

  return (
    <>
      <BackLink href={localePath(locale, "/teachers")}>{t.teachers.title}</BackLink>
      <div className="mb-8 flex flex-wrap items-center gap-5">
        <Initials name={teacher.name} large />
        <h1>{teacher.name}</h1>
      </div>
      {teacher.bio && (
        <div className="mb-10">
          <Prose text={teacher.bio} />
        </div>
      )}
      <section aria-labelledby="groups">
        <h2 id="groups" className="mb-3">
          {t.teachers.teaches}
        </h2>
        {teacher.groups.length === 0 ? <Empty>{t.teachers.noGroups}</Empty> : <GroupList groups={teacher.groups} locale={locale} t={t.group} />}
      </section>
    </>
  );
}

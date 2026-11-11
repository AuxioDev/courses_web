import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { getTeachers } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { Empty } from "@/components/ui";
import { PageHead } from "@/components/page-head";
import { TeacherList } from "@/components/teacher-list";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMeta(locale, "/teachers", t.teachers.title, t.teachers.lead);
}

export default async function TeachersPage() {
  const [{ locale, t }, teachers] = await Promise.all([getI18n(), getTeachers()]);
  return (
    <>
      <PageHead title={t.teachers.title} lead={t.teachers.lead} />
      {teachers.length === 0 ? <Empty>{t.teachers.none}</Empty> : <TeacherList teachers={teachers} locale={locale} t={t} />}
    </>
  );
}

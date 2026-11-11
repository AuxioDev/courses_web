import Link from "next/link";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";

export default async function NotFound() {
  const { locale, t } = await getI18n();
  return (
    <div className="max-w-xl py-10">
      <h1>{t.notFound.title}</h1>
      <p className="mt-3 text-muted">{t.notFound.body}</p>
      <Link href={localePath(locale, "/")} className="btn mt-6">
        {t.notFound.back}
      </Link>
    </div>
  );
}

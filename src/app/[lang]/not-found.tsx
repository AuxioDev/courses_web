import Link from "next/link";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";

export default async function NotFound() {
  const { locale, t } = await getI18n();
  return (
    <div className="notice">
      <h1>{t.notFound.title}</h1>
      <p className="notice-body">{t.notFound.body}</p>
      <Link href={localePath(locale, "/")} className="btn btn-lg mt-6">
        {t.notFound.back}
      </Link>
    </div>
  );
}

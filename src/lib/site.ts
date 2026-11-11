// The school's name, contacts and addresses, in one place. The name is a placeholder until
// the school chooses one: set NEXT_PUBLIC_SCHOOL_NAME, nothing else needs to change.
// Safe to import from client components: only NEXT_PUBLIC_ values are read at module scope.

export const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Online School";

const clean = (url: string) => url.replace(/\/$/, "");

// Server only: these read private environment variables when called.
export const siteUrl = () => clean(process.env.APP_URL ?? "http://localhost:3002");
export const schoolTimezone = () => process.env.SCHOOL_TIMEZONE || "Asia/Baku";

// Obviously fake defaults, so a missing variable is noticed before launch rather than after.
export function contacts() {
  const phone = process.env.CONTACT_PHONE || "+994 00 000 00 00";
  const whatsapp = process.env.CONTACT_WHATSAPP || "";
  const email = process.env.CONTACT_EMAIL || "hello@example.com";
  return {
    phone,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, "")}`,
    whatsappHref: whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null,
    email,
    isPlaceholder: !process.env.CONTACT_PHONE || !process.env.CONTACT_EMAIL,
  };
}

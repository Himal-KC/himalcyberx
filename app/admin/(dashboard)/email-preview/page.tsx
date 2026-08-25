import { EmailPreviewGallery } from "@/components/admin/email/EmailPreviewGallery";
import { getEmailPreviewItems } from "@/lib/email/preview-fixtures";

export const metadata = {
  title: "Email Preview | HCX Admin",
  robots: { index: false, follow: false },
};

export default function AdminEmailPreviewPage() {
  const items = getEmailPreviewItems();

  return (
    <div>
      <div className="mb-8">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Communications
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          EMAIL PREVIEW
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Visual preview of HimalCyberX email templates. No emails are sent from
          this page.
        </p>
      </div>

      <EmailPreviewGallery items={items} />
    </div>
  );
}

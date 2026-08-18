const messages: Record<string, string> = {
  created: "Article created successfully.",
  updated: "Article changes saved successfully.",
  deleted: "Article deleted successfully.",
};

export function AdminFlashBanner({ type }: { type: string }) {
  const message = messages[type];

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 rounded-lg border border-hcx-green/25 bg-hcx-green/10 px-4 py-3 text-sm text-hcx-green"
    >
      {message}
    </div>
  );
}

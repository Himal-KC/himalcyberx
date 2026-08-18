import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories/CategoriesManager";
import { getAdminCategoriesWithCounts } from "@/lib/supabase/admin-categories";

export const metadata: Metadata = {
  title: "Categories | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategoriesWithCounts();

  return (
    <div>
      <CategoriesManager categories={categories} />
    </div>
  );
}

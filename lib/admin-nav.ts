export interface AdminNavItem {
  label: string;
  href: string;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Articles", href: "/admin/articles" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Cyber Labs", href: "/admin/labs" },
  { label: "Tutorials", href: "/admin/tutorials" },
  { label: "Subscribers", href: "/admin/subscribers" },
  { label: "Email Preview", href: "/admin/email-preview" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Settings", href: "/admin/settings" },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

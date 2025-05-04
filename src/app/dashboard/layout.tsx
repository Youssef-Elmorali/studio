
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Qatrah Hayat",
  description: "Manage your activities on Qatrah Hayat.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Basic layout structure, can be enhanced with sidebars or tabs later
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Could add a dashboard-specific header/sidebar here */}
      {children}
    </div>
  );
}

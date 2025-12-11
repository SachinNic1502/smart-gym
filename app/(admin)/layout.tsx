import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="super_admin">
      {children}
    </DashboardLayout>
  );
}

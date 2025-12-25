import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardProvider } from "@/lib/hooks/use-dashboard";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayout role="super_admin">
        {children}
      </DashboardLayout>
    </DashboardProvider>
  );
}

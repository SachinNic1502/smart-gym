import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar - Fixed, Not Scrollable */}
            <div className="flex-shrink-0">
                <Sidebar role="super_admin" />
            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Header - Fixed */}
                <Header />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}

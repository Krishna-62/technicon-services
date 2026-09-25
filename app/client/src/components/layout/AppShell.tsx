import { useState, type ReactNode } from 'react';
import { useAuth } from '../../auth';
import { AppSidebar } from '../app-sidebar';
import { AppHeader } from '../app-header';
import FloatingChat from '../FloatingChat';

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#101312] text-[#F5F7F4] flex font-sans font-normal antialiased selection:bg-[#B8F23A]/25">
      {/* Sidebar */}
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#101312]">
        <AppHeader
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
          onRefresh={() => {
            // Trigger optional page re-fetch if needed
          }}
        />
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
        <FloatingChat />
      </div>
    </div>
  );
}

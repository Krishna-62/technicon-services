import { type ReactNode } from 'react';
import { useAuth } from '../../auth';
import { SidebarProvider, SidebarInset } from '../ui/sidebar';
import { AppSidebar } from '../app-sidebar';
import { AppHeader } from '../app-header';
import FloatingChat from '../FloatingChat';

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-[#F4F7F4] flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
        <FloatingChat />
      </SidebarInset>
    </SidebarProvider>
  );
}

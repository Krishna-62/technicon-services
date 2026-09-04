import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './ui/sidebar';
import {
  BarChart3Icon,
  Building2Icon,
  FileCheckIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
  LogOutIcon,
} from 'lucide-react';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isCurrent = (path: string) => location.pathname === path;
  const isReportsActive = ['/business-health', '/customer-health', '/opportunities', '/product-intelligence', '/chat-with-ai'].includes(location.pathname);

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-[#E3E8E4] bg-[#003B2B] text-white">
      {/* Brand Header */}
      <SidebarHeader className="h-16 justify-center px-4 border-b border-white/10">
        <SidebarMenuButton asChild size="lg" className="hover:bg-white/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#9CF45D] text-[#003B2B] flex items-center justify-center font-extrabold text-sm shrink-0">
              TS
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm tracking-tight text-white leading-tight">TECHNICON</span>
              <span className="text-[10px] font-bold text-[#9CF45D] tracking-wider uppercase">SERVICES</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-2 py-3 space-y-4">
        
        {/* Quick Action Button */}
        <SidebarGroup>
          <SidebarMenuItem className="flex items-center gap-2 px-2">
            <SidebarMenuButton asChild className="bg-[#9CF45D] text-[#003B2B] hover:bg-[#8ee84f] font-bold">
              <Link to="/quotations/new" className="flex items-center gap-2 justify-center w-full">
                <PlusIcon className="size-4" />
                <span>+ New Quotation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroup>

        {/* Primary Operational Modules */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/')} tooltip="Dashboard" className="hover:bg-white/10 text-white">
                <Link to="/">
                  <LayoutGridIcon className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/quotations')} tooltip="Quotations" className="hover:bg-white/10 text-white">
                <Link to="/quotations">
                  <FileTextIcon className="size-4" />
                  <span>Quotations</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/purchase-orders')} tooltip="Purchase Orders" className="hover:bg-white/10 text-white">
                <Link to="/purchase-orders">
                  <FileCheckIcon className="size-4" />
                  <span>Purchase Orders</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/performa-invoices')} tooltip="Performa Invoices" className="hover:bg-white/10 text-white">
                <Link to="/performa-invoices">
                  <FileTextIcon className="size-4" />
                  <span>Performa Invoices</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/companies')} tooltip="Companies" className="hover:bg-white/10 text-white">
                <Link to="/companies">
                  <Building2Icon className="size-4" />
                  <span>Companies</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/products')} tooltip="Products" className="hover:bg-white/10 text-white">
                <Link to="/products">
                  <PackageIcon className="size-4" />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Reports & AI Section */}
        <SidebarGroup>
          <div className="px-3 text-[10px] font-bold text-[#9CF45D] uppercase tracking-wider mb-1">Intelligence & Reports</div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/business-health')} tooltip="Business Health" className="hover:bg-white/10 text-white">
                <Link to="/business-health">
                  <BarChart3Icon className="size-4" />
                  <span>Business Health</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/customer-health')} tooltip="Customer Health" className="hover:bg-white/10 text-white">
                <Link to="/customer-health">
                  <UsersIcon className="size-4" />
                  <span>Customer Health</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/opportunities')} tooltip="Growth Opportunities" className="hover:bg-white/10 text-white">
                <Link to="/opportunities">
                  <SparklesIcon className="size-4" />
                  <span>Growth Opportunities</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/product-intelligence')} tooltip="Product Intelligence" className="hover:bg-white/10 text-white">
                <Link to="/product-intelligence">
                  <PackageIcon className="size-4" />
                  <span>Product Intelligence</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/chat-with-ai')} tooltip="Ask TECHNICON" className="hover:bg-white/10 text-[#9CF45D] font-bold">
                <Link to="/chat-with-ai">
                  <SparklesIcon className="size-4 text-[#9CF45D]" />
                  <span>Ask TECHNICON AI</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* System Settings & Admin */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isCurrent('/settings')} tooltip="Settings" className="hover:bg-white/10 text-white">
                <Link to="/settings">
                  <SettingsIcon className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {user.role === 'admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isCurrent('/admin')} tooltip="Admin" className="hover:bg-white/10 text-white">
                  <Link to="/admin">
                    <ShieldIcon className="size-4" />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      {/* Sidebar Footer User & Logout */}
      <SidebarFooter className="p-3 border-t border-white/10">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs text-white">
          <div className="flex flex-col min-w-0">
            <span className="font-bold truncate">{user.username}</span>
            <span className="text-[10px] text-[#9CF45D] uppercase font-semibold">{user.role}</span>
          </div>
          <button onClick={logout} className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Logout">
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

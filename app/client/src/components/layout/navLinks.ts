import type { ComponentType } from 'react';
import {
  AdminIcon,
  CompanyIcon,
  DashboardIcon,
  InvoiceIcon,
  ProductIcon,
  PurchaseOrderIcon,
  QuoteIcon,
  ReportIcon,
  SettingsIcon,
} from '../icons';

export interface NavLinkDef {
  to: string;
  label: string;
  end?: boolean;
  icon?: ComponentType;
}

// A collapsible parent (e.g. "Reports") that groups several child links under one expandable
// sidebar entry instead of navigating anywhere itself.
export interface NavGroupDef {
  label: string;
  icon: ComponentType;
  children: NavLinkDef[];
}

export type NavItem = NavLinkDef | NavGroupDef;

export function isNavGroup(item: NavItem): item is NavGroupDef {
  return 'children' in item;
}

export const navLinks: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: DashboardIcon },
  { to: '/quotations', label: 'Quotations', icon: QuoteIcon },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: PurchaseOrderIcon },
  { to: '/performa-invoices', label: 'Performa Invoices', icon: InvoiceIcon },
  { to: '/companies', label: 'Companies', icon: CompanyIcon },
  { to: '/products', label: 'Products', icon: ProductIcon },
  {
    label: 'Reports',
    icon: ReportIcon,
    children: [
      { to: '/business-health', label: 'Business Health' },
      { to: '/customer-health', label: 'Customer Health' },
      { to: '/opportunities', label: 'Growth Opportunities' },
      { to: '/product-intelligence', label: 'Product Intelligence' },
      { to: '/chat-with-ai', label: 'Chat with AI' },
    ],
  },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const adminNavLink: NavLinkDef = { to: '/admin', label: 'Admin', icon: AdminIcon };

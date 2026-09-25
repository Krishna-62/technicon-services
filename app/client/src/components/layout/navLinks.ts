import type { ComponentType } from 'react';
import {
  AdminIcon,
  CompanyIcon,
  DashboardIcon,
  InventoryIcon,
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
  {
    label: 'Sales',
    icon: ReportIcon,
    children: [
      { to: '/sales', label: 'Sales Overview', end: true },
      { to: '/sales/engineers', label: 'Engineers' },
      { to: '/sales/orders', label: 'Orders' },
      { to: '/sales/pending', label: 'Pending Sales' },
      { to: '/sales/activity', label: 'Activity' },
      { to: '/sales/reports', label: 'Sales Reports' },
    ],
  },
  { to: '/quotations', label: 'Quotations', icon: QuoteIcon },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: PurchaseOrderIcon },
  { to: '/performa-invoices', label: 'Performa Invoices', icon: InvoiceIcon },
  {
    label: 'Sale Reports',
    icon: ReportIcon,
    children: [
      { to: '/sale-reports', label: 'Sale Report List', end: true },
      { to: '/sale-reports/new', label: 'Create Sale Report' },
      { to: '/sale-reports/detail', label: 'Sale Report Detail' },
    ],
  },
  { to: '/companies', label: 'Companies', icon: CompanyIcon },
  { to: '/products', label: 'Products', icon: ProductIcon },
  {
    label: 'Procurement',
    icon: PurchaseOrderIcon,
    children: [
      { to: '/procurement', label: 'Overview', end: true },
      { to: '/procurement/requirements', label: 'Requirements' },
      { to: '/purchase-orders', label: 'Purchase Orders' },
      { to: '/procurement/suppliers', label: 'Suppliers' },
      { to: '/procurement/incoming', label: 'Incoming' },
      { to: '/procurement/receiving', label: 'Receiving' },
      { to: '/procurement/reports', label: 'Reports' },
      { to: '/procurement/activity', label: 'Activity' },
    ],
  },
  {
    label: 'Inventory',
    icon: InventoryIcon,
    children: [
      { to: '/inventory', label: 'Overview', end: true },
      { to: '/inventory/operations', label: 'Operations' },
      { to: '/inventory/warehouses', label: 'Warehouses' },
      { to: '/inventory/stock', label: 'Stock' },
      { to: '/inventory/stock-inward', label: 'Stock Inward' },
      { to: '/inventory/reservations', label: 'Reservations' },
      { to: '/inventory/intelligence', label: 'Stock Intelligence' },
    ],
  },
  {
    label: 'Reports',
    icon: ReportIcon,
    children: [
      { to: '/business-health', label: 'Business Health' },
      { to: '/customer-health', label: 'Customer Health' },
      { to: '/opportunities', label: 'Growth Opportunities' },
      { to: '/product-intelligence', label: 'Product Intelligence' },
      { to: '/reports/engineer-sales', label: 'Engineer Sales' },
      { to: '/chat-with-ai', label: 'Chat with AI' },
    ],
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    children: [
      { to: '/settings', label: 'System Settings', end: true },
      { to: '/settings/multi-firm', label: 'Multi-Firm' },
    ],
  },
];

export const adminNavLink: NavLinkDef = { to: '/admin', label: 'Admin', icon: AdminIcon };

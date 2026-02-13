'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SolidDashboardLayoutProps {
  children: ReactNode;
  userName?: string;
  userRole?: string;
}

export function SolidDashboardLayout({ 
  children, 
  userName = 'Oluwasebi Adeyemi',
  userRole = 'CEO, FOUNDER' 
}: SolidDashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { 
      href: '/dashboard', 
      label: 'Dashboard', 
      icon: 'dashboard',
      active: pathname === '/dashboard'
    },
    { 
      href: '/transactions', 
      label: 'Tax Filings', 
      icon: 'description',
      active: pathname?.startsWith('/transactions')
    },
    { 
      href: '/invoices', 
      label: 'Invoices', 
      icon: 'receipt_long',
      active: pathname?.startsWith('/invoices')
    },
    { 
      href: '/expenses', 
      label: 'Expenses', 
      icon: 'payments',
      active: pathname?.startsWith('/expenses')
    },
    { 
      href: '/reports', 
      label: 'Reports', 
      icon: 'assessment',
      active: pathname?.startsWith('/reports')
    },
  ];

  return (
    <div className="flex h-screen bg-dark-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-dark-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-2xl">account_balance</span>
            </div>
            <span className="text-xl font-bold text-dark-text-primary">KOMPLEET</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-dark-text-secondary hover:bg-dark-surface-hover hover:text-dark-text-primary'
              }`}
            >
              <span className="material-icons text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section - Upcoming Deadline */}
        <div className="p-4 border-t border-dark-border">
          <div className="bg-dark-background rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="material-icons text-primary-500 text-sm">schedule</span>
              <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
                Upcoming Deadline
              </span>
            </div>
            <p className="text-sm text-dark-text-primary">
              FIRS filing in <span className="font-bold text-primary-500">4 days</span>
            </p>
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-text-secondary hover:bg-dark-surface-hover hover:text-dark-text-primary transition-all duration-200"
          >
            <span className="material-icons text-xl">settings</span>
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
